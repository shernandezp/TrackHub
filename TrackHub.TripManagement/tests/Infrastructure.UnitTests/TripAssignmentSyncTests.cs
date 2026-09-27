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

using Common.Application.Exceptions;
using Common.Application.Interfaces;
using Common.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Moq;
using TrackHub.TripManagement.Domain.Constants;
using TrackHub.TripManagement.Domain.Records;
using TrackHub.TripManagement.Infrastructure.TripDB.Writers;

namespace Infrastructure.UnitTests;

// A driver reads trips through the Active TripAssignment, so every path that names a driver — create,
// edit, import, assign — has to write that assignment, not only Trip.DriverId.
[TestFixture]
public class TripAssignmentSyncTests
{
    private static readonly Guid TransporterId = WriterTestData.TransporterId;
    private static readonly Guid FirstDriver = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000001");
    private static readonly Guid SecondDriver = Guid.Parse("bbbbbbbb-0000-0000-0000-000000000002");

    private static IUser User()
    {
        var user = new Mock<IUser>();
        user.SetupGet(u => u.PrincipalType).Returns(PrincipalType.User);
        user.SetupGet(u => u.UserId).Returns(Guid.Parse("99999999-9999-9999-9999-999999999999"));
        return user.Object;
    }

    private static TripDto Dto(Guid? driverId, string code = "T-1")
        => new(code, TransporterId, driverId, null, null, null, "Depot", 4.65, -74.05, null, 150,
            new DateTimeOffset(2026, 9, 27, 12, 0, 0, TimeSpan.Zero), null, null, null);

    [Test]
    public async Task CreateWithADriver_WritesTheActiveAssignmentTheDriverReadsThrough()
    {
        using var context = WriterTestContext.Create();
        var writer = new TripWriter(context, User());

        var trip = await writer.CreateTripAsync(Dto(FirstDriver), WriterTestData.AccountId, CancellationToken.None);

        var assignments = await context.TripAssignments.AsNoTracking().Where(a => a.TripId == trip.TripId).ToListAsync();
        Assert.Multiple(() =>
        {
            Assert.That(assignments, Has.Count.EqualTo(1));
            Assert.That(assignments[0].DriverId, Is.EqualTo(FirstDriver));
            Assert.That(assignments[0].TransporterId, Is.EqualTo(TransporterId));
            Assert.That(assignments[0].Status, Is.EqualTo(TripAssignmentStatuses.Active));
        });
    }

    [Test]
    public async Task UpdateThatChangesTheDriver_EndsThePriorAssignmentAndOpensTheNewOne()
    {
        using var context = WriterTestContext.Create();
        var writer = new TripWriter(context, User());
        var trip = await writer.CreateTripAsync(Dto(FirstDriver), WriterTestData.AccountId, CancellationToken.None);
        context.ChangeTracker.Clear();

        await writer.UpdateTripAsync(trip.TripId, Dto(SecondDriver), WriterTestData.AccountId, null, CancellationToken.None);

        var assignments = await context.TripAssignments.AsNoTracking().Where(a => a.TripId == trip.TripId).ToListAsync();
        var stored = await context.Trips.AsNoTracking().SingleAsync(t => t.TripId == trip.TripId);
        Assert.Multiple(() =>
        {
            Assert.That(stored.DriverId, Is.EqualTo(SecondDriver));
            Assert.That(assignments.Single(a => a.Status == TripAssignmentStatuses.Active).DriverId, Is.EqualTo(SecondDriver));
            Assert.That(assignments.Single(a => a.Status == TripAssignmentStatuses.Ended).DriverId, Is.EqualTo(FirstDriver));
        });
    }

    [Test]
    public async Task UpdateThatKeepsTheDriver_LeavesTheAssignmentAlone_AndClearingItEndsIt()
    {
        using var context = WriterTestContext.Create();
        var writer = new TripWriter(context, User());
        var trip = await writer.CreateTripAsync(Dto(FirstDriver), WriterTestData.AccountId, CancellationToken.None);
        context.ChangeTracker.Clear();

        await writer.UpdateTripAsync(trip.TripId, Dto(FirstDriver, "T-1b"), WriterTestData.AccountId, null, CancellationToken.None);
        var afterSameDriver = await context.TripAssignments.AsNoTracking().Where(a => a.TripId == trip.TripId).ToListAsync();
        context.ChangeTracker.Clear();

        await writer.UpdateTripAsync(trip.TripId, Dto(null, "T-1c"), WriterTestData.AccountId, null, CancellationToken.None);
        var afterClearing = await context.TripAssignments.AsNoTracking().Where(a => a.TripId == trip.TripId).ToListAsync();

        Assert.Multiple(() =>
        {
            Assert.That(afterSameDriver, Has.Count.EqualTo(1), "an unchanged driver must not churn the assignment history");
            Assert.That(afterClearing.Count(a => a.Status == TripAssignmentStatuses.Active), Is.Zero, "no driver, no active assignment");
        });
    }

    [Test]
    public async Task UpdateWithAStaleLoadInstant_IsRefused()
    {
        using var context = WriterTestContext.Create();
        var writer = new TripWriter(context, User());
        var trip = await writer.CreateTripAsync(Dto(null), WriterTestData.AccountId, CancellationToken.None);
        context.ChangeTracker.Clear();
        var stale = new DateTimeOffset(2000, 1, 1, 0, 0, 0, TimeSpan.Zero);

        var ex = Assert.ThrowsAsync<ConflictException>(() => writer.UpdateTripAsync(trip.TripId, Dto(SecondDriver), WriterTestData.AccountId, stale, CancellationToken.None));

        Assert.That(ex!.Code, Is.EqualTo(TripErrorCodes.TripModifiedConcurrently));
    }
}
