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
/// Re-emits the entry and exit alerts of visits whose marker is still empty: detection stamps a
/// visit only after Manager accepted the alert, so a Manager blip costs a delay, never the alert.
/// </summary>
public class VisitAlertRetryService(
    IGeofenceEventReader geofenceEventReader,
    IGeofenceEventWriter geofenceEventWriter,
    IAlertEmitter alertEmitter,
    ILogger<VisitAlertRetryService> logger) : IVisitAlertRetryService
{
    public async Task<int> RetryPendingAlertsAsync(CancellationToken cancellationToken)
    {
        var pending = await geofenceEventReader.GetPendingVisitAlertsAsync(cancellationToken);
        var emitted = 0;

        foreach (var visit in pending)
        {
            try
            {
                // A geofence that stopped alerting on an edge still gets the visit stamped, so it never queues again.
                if (visit.EntryPending)
                {
                    if (visit.AlertOnEntry)
                    {
                        await alertEmitter.EmitGeofenceEnteredAsync(ToAlertDto(visit, dwellSeconds: null), cancellationToken);
                        emitted++;
                    }

                    await geofenceEventWriter.StampEntryAlertedAsync(visit.GeofenceEventId, DateTimeOffset.UtcNow, cancellationToken);
                }

                if (visit.ExitPending && visit.DepartureTimestamp is { } departure)
                {
                    if (visit.AlertOnExit)
                    {
                        await alertEmitter.EmitGeofenceExitedAsync(ToAlertDto(visit, (long)(departure - visit.EventDateTime).TotalSeconds), cancellationToken);
                        emitted++;
                    }

                    await geofenceEventWriter.StampExitAlertedAsync(visit.GeofenceEventId, DateTimeOffset.UtcNow, cancellationToken);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Retrying the alerts of visit {GeofenceEventId} failed; it stays pending", visit.GeofenceEventId);
            }
        }

        return emitted;
    }

    private static GeofenceAlertDto ToAlertDto(PendingVisitAlertVm visit, long? dwellSeconds)
        => new(visit.GeofenceEventId,
            visit.AccountId,
            visit.TransporterId,
            visit.GeofenceId,
            visit.GeofenceName,
            visit.GeofenceType,
            visit.EventDateTime,
            visit.DepartureTimestamp,
            dwellSeconds,
            visit.Latitude,
            visit.Longitude);
}
