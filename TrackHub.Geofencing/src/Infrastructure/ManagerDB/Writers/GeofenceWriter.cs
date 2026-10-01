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

using System.Text.Json;
using Common.Application.Interfaces;
using NetTopologySuite.Geometries;

namespace TrackHub.Geofencing.Infrastructure.Writers;

public sealed class GeofenceWriter(IApplicationDbContext context, IUser user) : IGeofenceWriter
{
    // Fixed-segment buffer for circle geofences: detection, indexes, and consumers keep
    // operating on a plain polygon while the editor renders a true circle from the metadata.
    private const int CircleSegments = 64;

    public async Task<GeofenceVm> CreateGeofenceAsync(GeofenceDto geofenceDto, Guid accountId, CancellationToken cancellationToken)
    {
        var (geom, circleCenter) = BuildGeometry(geofenceDto);
        var geofence = new Geofence(
            geofenceDto.GeofenceId,
            geom,
            accountId,
            geofenceDto.Name,
            geofenceDto.Description,
            geofenceDto.Color,
            geofenceDto.Type,
            true)
        {
            CircleCenter = circleCenter,
            CircleRadiusMeters = circleCenter is null ? null : geofenceDto.CircleRadiusMeters,
            AlertOnEntry = geofenceDto.AlertOnEntry,
            AlertOnExit = geofenceDto.AlertOnExit,
            DwellThresholdMinutes = geofenceDto.DwellThresholdMinutes
        };

        await context.Geofences.AddAsync(geofence, cancellationToken);
        await ReconcileOpenVisitsAsync(geofence, cancellationToken);
        AddAuditEvent(accountId, "CreateGeofence", geofence.GeofenceId, null, ToAuditJson(geofence));
        await context.SaveChangesAsync(cancellationToken);

        return CastGeofenceVm(geofence);
    }

    public async Task UpdateGeofenceAsync(GeofenceDto geofenceDto, CancellationToken cancellationToken)
    {
        var geofence = await context.Geofences.FindAsync([geofenceDto.GeofenceId], cancellationToken)
            ?? throw new NotFoundException(nameof(Geofence), $"{geofenceDto.GeofenceId}");
        var oldValues = ToAuditJson(geofence);

        context.Geofences.Attach(geofence);
        if (geofenceDto.ExpectedVersion is { } expectedVersion)
        {
            context.Geofences.Entry(geofence).Property(g => g.Version).OriginalValue = expectedVersion;
        }

        geofence.Version++;

        var (geom, circleCenter) = BuildGeometry(geofenceDto);
        var wasActive = geofence.Active;
        var reshaped = !geofence.Geom.EqualsTopologically(geom);
        geofence.Geom = geom;
        geofence.CircleCenter = circleCenter;
        geofence.CircleRadiusMeters = circleCenter is null ? null : geofenceDto.CircleRadiusMeters;
        geofence.Name = geofenceDto.Name;
        geofence.Description = geofenceDto.Description;
        geofence.Color = geofenceDto.Color;
        geofence.Type = geofenceDto.Type;
        geofence.Active = geofenceDto.Active;
        geofence.AlertOnEntry = geofenceDto.AlertOnEntry;
        geofence.AlertOnExit = geofenceDto.AlertOnExit;
        geofence.DwellThresholdMinutes = geofenceDto.DwellThresholdMinutes;
        AddAuditEvent(geofence.AccountId, "UpdateGeofence", geofence.GeofenceId, oldValues, ToAuditJson(geofence));

        // Units already inside a zone that appears, and units left outside a zone that shrinks or
        // closes, are initial state: recorded as visits, never announced as movement.
        if (wasActive != geofence.Active || reshaped)
        {
            await ReconcileOpenVisitsAsync(geofence, cancellationToken);
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteGeofenceAsync(Guid geofenceId, CancellationToken cancellationToken)
    {
        var geofence = await context.Geofences.FindAsync([geofenceId], cancellationToken)
            ?? throw new NotFoundException(nameof(Geofence), $"{geofenceId}");

        // Completed visits are history and are preserved: deactivation is the supported way to
        // retire a zone. Open visits are current state (units inside right now, including the
        // initial-state rows a new zone is seeded with) and leave with the zone.
        var hasHistory = await context.GeofenceEvents
            .AnyAsync(e => e.GeofenceId == geofenceId && e.DepartureTimestamp != null, cancellationToken);
        if (hasHistory)
            throw new Common.Application.Exceptions.ConflictException(
                "This geofence has recorded visit history and cannot be deleted. Deactivate it instead to keep the history.");

        var openVisits = await context.GeofenceEvents
            .AsTracking()
            .Where(e => e.GeofenceId == geofenceId)
            .ToListAsync(cancellationToken);
        context.GeofenceEvents.RemoveRange(openVisits);

        context.Geofences.Attach(geofence);
        AddAuditEvent(geofence.AccountId, "DeleteGeofence", geofence.GeofenceId, ToAuditJson(geofence), null);

        context.Geofences.Remove(geofence);
        await context.SaveChangesAsync(cancellationToken);
    }

    private async Task ReconcileOpenVisitsAsync(Geofence geofence, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var open = await context.GeofenceEvents
            .AsTracking()
            .Where(e => e.GeofenceId == geofence.GeofenceId && e.DepartureTimestamp == null)
            .ToListAsync(cancellationToken);
        var geom = geofence.Geom;
        var inside = geofence.Active
            ? await context.Transporters
                .Where(t => t.AccountId == geofence.AccountId && geom.Intersects(t.Geom))
                .Select(t => new { t.TransporterId, t.Geom })
                .ToListAsync(cancellationToken)
            : [];
        var insideIds = inside.Select(t => t.TransporterId).ToHashSet();
        var openIds = open.Select(v => v.TransporterId).ToHashSet();

        foreach (var visit in open.Where(v => !insideIds.Contains(v.TransporterId)))
        {
            visit.DepartureTimestamp = now;
            visit.ExitAlertedAt = now;
        }

        foreach (var transporter in inside.Where(t => !openIds.Contains(t.TransporterId)))
        {
            context.GeofenceEvents.Add(new GeofenceEvent(transporter.TransporterId, geofence.GeofenceId, geofence.AccountId, now, transporter.Geom.Y, transporter.Geom.X)
            {
                EntryAlertedAt = now,
            });
        }
    }

    private static (Polygon Geom, Point? CircleCenter) BuildGeometry(GeofenceDto geofenceDto)
    {
        if (geofenceDto.CircleCenter is { } center && geofenceDto.CircleRadiusMeters is { } radiusMeters)
        {
            var circleCenter = new Point(center.Longitude, center.Latitude) { SRID = 4326 };
            return (BuildCirclePolygon(center, radiusMeters), circleCenter);
        }

        if (geofenceDto.Geom is { } geom)
            return (CastGeofence(geom), null);

        throw new Common.Application.Exceptions.ValidationException([new FluentValidation.Results.ValidationFailure(
            nameof(GeofenceDto.Geom), "Either polygon coordinates or a circle (center + radius) is required.")]);
    }

    private static Polygon BuildCirclePolygon(CoordinateVm center, double radiusMeters)
    {
        // Equirectangular approximation: accurate for the radius bounds (≤100 km) at working
        // latitudes. GeofenceDtoValidator guarantees the inputs stay in its valid range:
        // center latitude within ±85° and the ring never crossing the ±180° meridian.
        const double MetersPerDegreeLatitude = 111_320d;
        var metersPerDegreeLongitude = MetersPerDegreeLatitude *
            Math.Max(Math.Cos(center.Latitude * Math.PI / 180d), 0.01);

        var coordinates = new Coordinate[CircleSegments + 1];
        for (var i = 0; i < CircleSegments; i++)
        {
            var angle = 2d * Math.PI * i / CircleSegments;
            coordinates[i] = new Coordinate(
                center.Longitude + radiusMeters * Math.Sin(angle) / metersPerDegreeLongitude,
                center.Latitude + radiusMeters * Math.Cos(angle) / MetersPerDegreeLatitude);
        }
        coordinates[CircleSegments] = coordinates[0].Copy();

        return new Polygon(new LinearRing(coordinates))
        {
            SRID = 4326
        };
    }

    private static Polygon CastGeofence(MultiPolygonVm polygon)
    {
        var coordinates = polygon.Coordinates.Select(x => new Coordinate(x.Longitude, x.Latitude)).ToList();
        if (coordinates.Count > 0 && !coordinates[0].Equals2D(coordinates[^1]))
            coordinates.Add(coordinates[0].Copy());
        var ring = new LinearRing([.. coordinates]);
        return new Polygon(ring)
        {
            SRID = 4326
        };
    }

    private static GeofenceVm CastGeofenceVm(Geofence geofence)
        => new(geofence.GeofenceId,
            geofence.AccountId,
            new MultiPolygonVm([.. geofence.Geom.Coordinates.Select(c => new CoordinateVm(c.Y, c.X))], 4326),
            geofence.Name,
            geofence.Description,
            geofence.Color,
            geofence.Type,
            geofence.Active,
            geofence.CircleCenter is null ? null : new CoordinateVm(geofence.CircleCenter.Y, geofence.CircleCenter.X),
            geofence.CircleRadiusMeters,
            geofence.AlertOnEntry,
            geofence.AlertOnExit,
            geofence.DwellThresholdMinutes,
            geofence.Version);

    private void AddAuditEvent(Guid accountId, string action, Guid geofenceId, string? oldValuesJson, string? newValuesJson)
    {
        context.AuditEvents.Add(new AuditEvent(
            accountId,
            user.PrincipalType.ToString(),
            user.UserId?.ToString() ?? user.ClientId ?? user.SubjectId ?? string.Empty,
            action,
            "Geofence",
            geofenceId.ToString(),
            "Success",
            oldValuesJson,
            newValuesJson,
            null,
            null,
            null,
            user.CorrelationId));
    }

    private static string ToAuditJson(Geofence geofence)
        => JsonSerializer.Serialize(new
        {
            geofence.GeofenceId,
            geofence.AccountId,
            geofence.Name,
            geofence.Description,
            geofence.Color,
            geofence.Type,
            geofence.Active,
            geofence.CircleRadiusMeters,
            geofence.AlertOnEntry,
            geofence.AlertOnExit,
            geofence.DwellThresholdMinutes
        });
}
