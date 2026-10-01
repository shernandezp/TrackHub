// Copyright (c) 2026 Sergio Hernandez. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License").
//  You may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

using Microsoft.Extensions.Logging;
using TrackHub.Geofencing.Application.GeofenceEvents.Services.Interfaces;

namespace TrackHub.Geofencing.Application.GeofenceEvents.Services;

/// <summary>
/// Service that processes transporter positions to detect geofence entry/exit events.
/// </summary>
public class GeofenceDetectionService(
    IGeofenceReader geofenceReader,
    IGeofenceEventReader geofenceEventReader,
    IGeofenceEventWriter geofenceEventWriter,
    IAlertEmitter alertEmitter,
    ILogger<GeofenceDetectionService> logger) : IGeofenceDetectionService
{
    private static readonly TimeSpan MinEventInterval = TimeSpan.FromSeconds(30);

    public async Task<GeofenceProcessingResultVm> ProcessPositionsAsync(
        IEnumerable<TransporterPositionDto> positions,
        Guid accountId,
        CancellationToken cancellationToken)
    {
        var ordered = positions
            .OrderBy(p => p.TransporterId)
            .ThenBy(p => p.DeviceDateTime)
            .ToList();

        if (ordered.Count == 0)
            return new GeofenceProcessingResultVm(0, 0, 0);

        // A fix at or before the transporter's last processed one arrived out of order; applying it
        // would close a visit before it opened or reopen one already left.
        var cursors = await geofenceEventReader.GetDetectionCursorsAsync(
            [.. ordered.Select(p => p.TransporterId).Distinct()], accountId, cancellationToken);
        var positionsList = ordered
            .Where(p => !cursors.TryGetValue(p.TransporterId, out var lastFixAt) || p.DeviceDateTime > lastFixAt)
            .ToList();

        if (positionsList.Count < ordered.Count)
            logger.LogDebug("Skipped {Count} out-of-order position(s) for account {AccountId}.", ordered.Count - positionsList.Count, accountId);

        if (positionsList.Count == 0)
            return new GeofenceProcessingResultVm(0, 0, 0);


        // Pre-load open events for all transporters, and resolve containment for the WHOLE batch.
        // Both used to run per transporter and per position, so one sync cycle became thousands of
        // round trips with a ST_Contains each.
        var transporterIds = positionsList.Select(p => p.TransporterId).Distinct().ToList();
        var openEvents = await geofenceEventReader.GetOpenEventsForTransportersAsync(transporterIds, accountId, cancellationToken);
        var openEventsByTransporter = transporterIds.ToDictionary(
            id => id,
            id => openEvents.Where(e => e.TransporterId == id).ToDictionary(e => e.GeofenceId));

        var containmentByIndex = await geofenceReader.GetGeofenceIdsContainingPointsAsync(
            accountId,
            [.. positionsList.Select(p => (p.Latitude, p.Longitude))],
            cancellationToken);

        var resolved = positionsList
            .Select((position, index) => (
                Position: position,
                Containing: containmentByIndex.TryGetValue(index, out var hits) ? hits.ToHashSet() : []))
            .ToList();

        // Process positions and accumulate results
        var eventsCreated = 0;
        var eventsUpdated = 0;
        var entries = new List<GeofenceEventVm>();
        var exits = new List<GeofenceEventVm>();

        foreach (var transporterPositions in resolved.GroupBy(p => p.Position.TransporterId))
        {
            var transporterOpenEvents = openEventsByTransporter[transporterPositions.Key];

            foreach (var (position, containing) in transporterPositions)
            {
                var (created, updated) = await ProcessPositionAsync(
                    position, containing, accountId, transporterOpenEvents, entries, exits, cancellationToken);

                eventsCreated += created;
                eventsUpdated += updated;
            }
        }

        await geofenceEventWriter.AdvanceDetectionCursorsAsync(
            accountId,
            positionsList.GroupBy(p => p.TransporterId).ToDictionary(g => g.Key, g => g.Max(p => p.DeviceDateTime)),
            cancellationToken);

        // Post-commit, best-effort alert emission: a failure is logged, the visit stays unstamped
        // and the retry loop (VisitAlertRetryService) picks it up.
        if (entries.Count > 0 || exits.Count > 0)
            await EmitAlertsAsync(accountId, entries, exits, cancellationToken);

        return new GeofenceProcessingResultVm(
            positionsList.Count,
            eventsCreated,
            eventsUpdated);
    }

    private async Task<(int Created, int Updated)> ProcessPositionAsync(
        TransporterPositionDto position,
        HashSet<Guid> containingGeofences,
        Guid accountId,
        Dictionary<Guid, GeofenceEventVm> openEvents,
        List<GeofenceEventVm> entries,
        List<GeofenceEventVm> exits,
        CancellationToken cancellationToken)
    {
        var created = 0;
        var updated = 0;

        // Process entries (in geofence but no open event)
        foreach (var geofenceId in containingGeofences)
        {
            if (openEvents.TryGetValue(geofenceId, out var stillInside))
            {
                // Back inside: the outside-since clock restarts on the next departure, otherwise a
                // stale one would let the following exit skip the debounce entirely.
                if (stillInside.OutsideSinceAt is not null)
                {
                    await geofenceEventWriter.SetOutsideSinceAsync(stillInside.GeofenceEventId, null, cancellationToken);
                    openEvents[geofenceId] = stillInside with { OutsideSinceAt = null };
                }

                continue;
            }

            // Create entry event; null = the visit already exists (a redelivered batch, or a concurrent
            // pass opened it) and must not be counted or re-alerted, only tracked.
            var newEvent = await geofenceEventWriter.CreateEntryEventAsync(
                new GeofenceEventDto(
                    position.TransporterId,
                    geofenceId,
                    accountId,
                    position.DeviceDateTime,
                    position.Latitude,
                    position.Longitude),
                cancellationToken);
            if (newEvent is not { } createdEvent)
            {
                var winner = (await geofenceEventReader.GetOpenEventsForTransporterAsync(position.TransporterId, accountId, cancellationToken))
                    .FirstOrDefault(e => e.GeofenceId == geofenceId);
                if (winner.GeofenceEventId != Guid.Empty)
                {
                    openEvents[geofenceId] = winner;
                }

                continue;
            }

            created++;
            entries.Add(createdEvent);
            openEvents[geofenceId] = createdEvent;
        }

        // Process exits (has open event but not in geofence)
        var geofencesToClose = openEvents.Keys
            .Where(id => !containingGeofences.Contains(id))
            .ToList();

        foreach (var geofenceId in geofencesToClose)
        {
            var openEvent = openEvents[geofenceId];

            // Debounced against the first fix seen OUTSIDE, not against the entry instant. Measured
            // from entry, a short visit had its exit skipped and was closed by a much later fix, so
            // the departure time became the sampling interval; and a long stay whose first outside
            // fix arrived late was closed with no debounce at all.
            if (openEvent.OutsideSinceAt is not { } outsideSince)
            {
                await geofenceEventWriter.SetOutsideSinceAsync(
                    openEvent.GeofenceEventId, position.DeviceDateTime, cancellationToken);
                openEvents[geofenceId] = openEvent with { OutsideSinceAt = position.DeviceDateTime };
                continue;
            }

            if ((position.DeviceDateTime - outsideSince) < MinEventInterval)
                continue;

            // Stamped at the FIRST outside fix, not the one that confirms it: charging the debounce
            // window to the visit would overstate dwell by exactly what the debounce removes.
            var closedEvent = await geofenceEventWriter.UpdateExitEventAsync(
                openEvent.GeofenceEventId,
                outsideSince,
                cancellationToken);

            updated++;
            exits.Add(closedEvent);
            openEvents.Remove(geofenceId);
        }

        return (created, updated);
    }

    private async Task EmitAlertsAsync(
        Guid accountId,
        IReadOnlyCollection<GeofenceEventVm> entries,
        IReadOnlyCollection<GeofenceEventVm> exits,
        CancellationToken cancellationToken)
    {
        IReadOnlyDictionary<Guid, GeofenceAlertInfoVm> alertInfo;
        try
        {
            alertInfo = await geofenceReader.GetActiveGeofenceAlertInfoAsync(accountId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to load geofence alert metadata for account {AccountId}; skipping alert emission for this batch", accountId);
            return;
        }

        foreach (var entry in entries)
        {
            if (!alertInfo.TryGetValue(entry.GeofenceId, out var info) || !info.AlertOnEntry)
                continue;

            try
            {
                await alertEmitter.EmitGeofenceEnteredAsync(ToAlertDto(accountId, entry, info, dwellSeconds: null), cancellationToken);
                await geofenceEventWriter.StampEntryAlertedAsync(entry.GeofenceEventId, DateTimeOffset.UtcNow, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to emit GeofenceEntered alert for event {GeofenceEventId}", entry.GeofenceEventId);
            }
        }

        foreach (var exit in exits)
        {
            if (!alertInfo.TryGetValue(exit.GeofenceId, out var info) || !info.AlertOnExit)
                continue;

            try
            {
                var dwellSeconds = exit.DepartureTimestamp is null
                    ? (long?)null
                    : (long)(exit.DepartureTimestamp.Value - exit.Timestamp).TotalSeconds;
                await alertEmitter.EmitGeofenceExitedAsync(ToAlertDto(accountId, exit, info, dwellSeconds), cancellationToken);
                await geofenceEventWriter.StampExitAlertedAsync(exit.GeofenceEventId, DateTimeOffset.UtcNow, cancellationToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to emit GeofenceExited alert for event {GeofenceEventId}", exit.GeofenceEventId);
            }
        }
    }

    private static GeofenceAlertDto ToAlertDto(
        Guid accountId,
        GeofenceEventVm evt,
        GeofenceAlertInfoVm info,
        long? dwellSeconds)
        => new(evt.GeofenceEventId,
            accountId,
            evt.TransporterId,
            evt.GeofenceId,
            info.Name,
            info.Type,
            evt.Timestamp,
            evt.DepartureTimestamp,
            dwellSeconds,
            evt.Latitude,
            evt.Longitude);
}
