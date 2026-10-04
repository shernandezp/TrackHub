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

using Ardalis.GuardClauses;
using Common.Application.Interfaces;
using Common.Domain.Constants;
using TrackHub.Telemetry.Application.GpsIntegration.Queries;
using TrackHub.Telemetry.Infrastructure.TelemetryDB.Entities;
using TrackHub.Telemetry.Infrastructure.TelemetryDB.Readers;

namespace TrackHub.Telemetry.Application.UnitTests;

// The history feed follows the same visibility as the replay read: a plain user gets the fixes of
// the transporters their active groups make visible, and an invisible transporter id is NotFound.
[TestFixture]
public class PositionHistoryVisibilityTests
{
    private static TransporterPositionHistory Fix(Guid accountId, Guid transporterId, string key)
        => new(accountId, Guid.NewGuid(), Guid.NewGuid(), transporterId, DateTimeOffset.UtcNow, DateTimeOffset.UtcNow, 1, 2, null, 0, null, null, null, null, null, null, null, key);

    private static (Infrastructure.TelemetryDB.ApplicationDbContext Context, Guid AccountId, Guid UserId, Guid InGroup, Guid OutOfGroup) Seed()
    {
        var accountId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var inGroup = Guid.NewGuid();
        var outOfGroup = Guid.NewGuid();
        const long groupId = 7L;
        var context = TestDb.NewContext();
        context.Transporters.Add(new Transporter { TransporterId = inGroup, AccountId = accountId, Name = "In", TransporterTypeId = 1 });
        context.Transporters.Add(new Transporter { TransporterId = outOfGroup, AccountId = accountId, Name = "Out", TransporterTypeId = 1 });
        context.Groups.Add(new Group { GroupId = groupId, AccountId = accountId, Active = true });
        context.Set<TransporterGroup>().Add(new TransporterGroup { TransporterId = inGroup, GroupId = groupId });
        context.UsersGroup.Add(new UserGroup { UserId = userId, GroupId = groupId });
        context.TransporterPositionHistory.Add(Fix(accountId, inGroup, "in"));
        context.TransporterPositionHistory.Add(Fix(accountId, outOfGroup, "out"));
        context.SaveChanges();
        return (context, accountId, userId, inGroup, outOfGroup);
    }

    private static GetPositionHistoryQueryHandler Handler(Infrastructure.TelemetryDB.ApplicationDbContext context, Common.Application.Interfaces.ICurrentPrincipal principal)
        => new(new TransporterPositionHistoryReader(context, principal), new VisibleTransporterReader(context, principal), principal);

    [Test]
    public async Task PlainUser_FeedWithoutATransporter_IsNarrowedToTheirGroups()
    {
        var (context, accountId, userId, inGroup, _) = Seed();
        await using var _ = context;
        var principal = TestDb.PrincipalFor(accountId, PrincipalType.User, userId, role: null);

        var page = await Handler(context, principal).Handle(new GetPositionHistoryQuery(accountId), CancellationToken.None);

        Assert.That(page.Items.Select(p => p.TransporterId), Is.EquivalentTo(new[] { inGroup }));
    }

    [Test]
    public async Task PlainUser_AskingForAnInvisibleTransporter_GetsNotFound()
    {
        var (context, accountId, userId, _, outOfGroup) = Seed();
        await using var _ = context;
        var principal = TestDb.PrincipalFor(accountId, PrincipalType.User, userId, role: null);

        await Assert.ThrowsAsync<NotFoundException>(() => Handler(context, principal).Handle(new GetPositionHistoryQuery(accountId, outOfGroup), CancellationToken.None));
    }

    [Test]
    public async Task ManagerRole_ReadsTheWholeAccount()
    {
        var (context, accountId, userId, _, _) = Seed();
        await using var _ = context;
        var principal = TestDb.PrincipalFor(accountId, PrincipalType.User, userId, role: Roles.Manager);

        var page = await Handler(context, principal).Handle(new GetPositionHistoryQuery(accountId), CancellationToken.None);

        Assert.That(page.Items, Has.Count.EqualTo(2));
    }
}
