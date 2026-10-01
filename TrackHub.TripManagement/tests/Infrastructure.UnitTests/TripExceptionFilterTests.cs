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

using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using TrackHub.TripManagement.Domain.Constants;
using TrackHub.TripManagement.Domain.Models;
using TrackHub.TripManagement.Infrastructure.TripDB;
using TrackHub.TripManagement.Infrastructure.TripDB.Entities;
using TrackHub.TripManagement.Infrastructure.TripDB.Readers;

namespace Infrastructure.UnitTests;

[TestFixture]
public class TripExceptionFilterTests
{
    private static readonly Guid AccountId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = DateTimeOffset.UtcNow;

    private static ApplicationDbContext Seeded()
    {
        var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"trip-exceptions-{Guid.NewGuid()}")
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .Options);

        AddTrip(context, "OVERDUE", TripStatuses.Created, Now.AddHours(-3), false, false);
        AddTrip(context, "SCHEDULED", TripStatuses.Created, Now.AddHours(3), false, false);
        AddTrip(context, "DELAYED", TripStatuses.InProgress, Now.AddHours(-1), false, false,
            (TripStopStatuses.Departed, null), (TripStopStatuses.Pending, Now.AddMinutes(-5)));
        AddTrip(context, "ONTIME", TripStatuses.InProgress, Now.AddHours(-1), false, false,
            (TripStopStatuses.Pending, null), (TripStopStatuses.Pending, Now.AddMinutes(-5)));
        AddTrip(context, "STALLED", TripStatuses.InProgress, Now.AddHours(-1), false, false,
            (TripStopStatuses.Departed, null), (TripStopStatuses.Arrived, null));
        AddTrip(context, "UNLOADING", TripStatuses.InProgress, Now.AddHours(-1), false, false,
            (TripStopStatuses.Arrived, Now.AddMinutes(-2)), (TripStopStatuses.Pending, null));
        AddTrip(context, "LOADING", TripStatuses.InProgress, Now.AddHours(-1), true, false,
            (TripStopStatuses.Arrived, Now), (TripStopStatuses.Pending, null));
        AddTrip(context, "DEVIATED", TripStatuses.InProgress, Now.AddHours(-1), false, true,
            (TripStopStatuses.Pending, null));
        AddTrip(context, "DONE", TripStatuses.Completed, Now.AddHours(-5), false, false,
            (TripStopStatuses.Arrived, Now));

        context.SaveChanges();
        return context;
    }

    private static void AddTrip(ApplicationDbContext context, string code, string status, DateTimeOffset plannedStart,
        bool originArrived, bool deviated, params (string Status, DateTimeOffset? DelayAlertedAt)[] stops)
    {
        var tripId = Guid.NewGuid();
        context.Trips.Add(new Trip
        {
            TripId = tripId,
            AccountId = AccountId,
            Code = code,
            Status = status,
            PlannedStartAt = plannedStart,
            TransporterId = Guid.NewGuid(),
            OriginName = "Depot",
            OriginPoint = new Point(-74.05, 4.65) { SRID = 4326 },
            OriginArrivedAt = originArrived ? plannedStart : null,
            DeviationOpenedAt = deviated ? Now.AddMinutes(-10) : null,
        });

        var sequence = 0;
        foreach (var (stopStatus, delayAlertedAt) in stops)
        {
            context.TripStops.Add(new TripStop
            {
                AccountId = AccountId,
                TripId = tripId,
                Sequence = ++sequence,
                Name = $"{code}-{sequence}",
                Point = new Point(-74.0, 4.6) { SRID = 4326 },
                Status = stopStatus,
                DelayAlertedAt = delayAlertedAt,
            });
        }
    }

    private static bool Shows(TripVm trip, string exception) => exception switch
    {
        TripExceptions.Overdue => trip.Phase == TripPhases.Overdue,
        TripExceptions.OffCorridor => trip.DeviationOpenedAt is not null,
        TripExceptions.Delayed => trip.PhaseDelayed,
        TripExceptions.StalledFinalStop => trip.Status == TripStatuses.InProgress && trip.Phase == TripPhases.AtStop && trip.PendingStopCount == 0,
        _ => false,
    };

    [TestCase(TripExceptions.Overdue, "OVERDUE")]
    [TestCase(TripExceptions.Delayed, "DELAYED,UNLOADING")]
    [TestCase(TripExceptions.OffCorridor, "DEVIATED")]
    [TestCase(TripExceptions.StalledFinalStop, "STALLED")]
    public async Task TheFilterSelectsExactlyTheTripsWhosePhaseShowsTheException(string exception, string expected)
    {
        using var context = Seeded();
        var reader = new TripReader(context, new AccountFeatureReader(context));

        var all = await reader.GetTripsPageAsync(AccountId, null, null, null, null, null, null, null, null, null, 0, 50, CancellationToken.None);
        var filtered = await reader.GetTripsPageAsync(AccountId, null, null, null, null, null, null, null, null, exception, 0, 50, CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(filtered.Items.Select(t => t.Code), Is.EquivalentTo(expected.Split(',')));
            Assert.That(filtered.Items.Select(t => t.Code), Is.EquivalentTo(all.Items.Where(t => Shows(t, exception)).Select(t => t.Code)),
                "the SQL filter and the phase resolver disagree");
            Assert.That(filtered.TotalCount, Is.EqualTo(filtered.Items.Count));
        });
    }
}
