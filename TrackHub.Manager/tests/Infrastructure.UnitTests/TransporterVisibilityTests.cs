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

using Common.Application.Interfaces;
using Common.Domain.Constants;
using Moq;
using TrackHub.Manager.Infrastructure;
using TrackHub.Manager.Infrastructure.Interfaces;
using TrackHub.Manager.Infrastructure.ManagerDB.Readers;

namespace Infrastructure.UnitTests;

// One visibility predicate: Administrator/Manager read the account, everyone else the transporters
// of the active groups they belong to; an invisible id is NotFound. For a user other than the
// caller, privilege comes from the role Security replicates onto app.users.
[TestFixture]
public class TransporterVisibilityTests
{
    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    private static ICurrentPrincipal Principal(Guid accountId, Guid? userId, string? role = null, PrincipalType type = PrincipalType.User)
    {
        var principal = new Mock<ICurrentPrincipal>();
        principal.SetupGet(p => p.AccountId).Returns(type == PrincipalType.User ? accountId : null);
        principal.SetupGet(p => p.PrincipalType).Returns(type);
        principal.SetupGet(p => p.UserId).Returns(userId);
        principal.SetupGet(p => p.Role).Returns(role);
        return principal.Object;
    }

    private sealed record Fleet(Guid AccountId, Guid UserId, Transporter InGroup, Transporter InInactiveGroup, Transporter Ungrouped, long GroupId);

    private static async Task<Fleet> SeedAsync(ApplicationDbContext context)
    {
        var accountId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var inGroup = new Transporter("IN", 1, accountId);
        var inInactive = new Transporter("INACTIVE", 1, accountId);
        var ungrouped = new Transporter("OUT", 1, accountId);
        var active = new Group("ops", "", true, accountId);
        var inactive = new Group("old", "", false, accountId);
        active.Transporters.Add(inGroup);
        inactive.Transporters.Add(inInactive);
        await context.Users.AddAsync(new User(userId, "alice", true, accountId));
        await context.Transporters.AddRangeAsync(inGroup, inInactive, ungrouped);
        await context.Groups.AddRangeAsync(active, inactive);
        await context.SaveChangesAsync(CancellationToken.None);
        await context.UsersGroup.AddRangeAsync(
            new UserGroup { UserId = userId, GroupId = active.GroupId },
            new UserGroup { UserId = userId, GroupId = inactive.GroupId });
        await context.SaveChangesAsync(CancellationToken.None);
        return new Fleet(accountId, userId, inGroup, inInactive, ungrouped, active.GroupId);
    }

    [Test]
    public async Task PlainUser_AccountWideReads_NarrowToActiveGroups()
    {
        await using var context = NewContext(nameof(PlainUser_AccountWideReads_NarrowToActiveGroups));
        var fleet = await SeedAsync(context);
        var reader = new TransporterReader(context as IApplicationDbContext, Principal(fleet.AccountId, fleet.UserId));

        var page = await reader.GetTransportersByAccountAsync(fleet.AccountId, 0, 50, null, CancellationToken.None);
        var lookup = await reader.GetTransporterLookupByAccountAsync(fleet.AccountId, 50, CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(page.TotalCount, Is.EqualTo(1));
            Assert.That(page.Items.Select(t => t.TransporterId), Is.EquivalentTo(new[] { fleet.InGroup.TransporterId }));
            Assert.That(lookup.Select(t => t.TransporterId), Is.EquivalentTo(new[] { fleet.InGroup.TransporterId }), "an inactive group grants nothing");
        });
    }

    [Test]
    public async Task PlainUser_TransporterOutsideTheirGroups_IsNotFound()
    {
        await using var context = NewContext(nameof(PlainUser_TransporterOutsideTheirGroups_IsNotFound));
        var fleet = await SeedAsync(context);
        var reader = new TransporterReader(context as IApplicationDbContext, Principal(fleet.AccountId, fleet.UserId));

        Assert.Multiple(async () =>
        {
            Assert.That((await reader.GetTransporterAsync(fleet.InGroup.TransporterId, CancellationToken.None)).TransporterId, Is.EqualTo(fleet.InGroup.TransporterId));
            Assert.ThrowsAsync<NotFoundException>(() => reader.GetTransporterAsync(fleet.Ungrouped.TransporterId, CancellationToken.None));
            Assert.ThrowsAsync<NotFoundException>(() => reader.GetTransporterAsync(fleet.InInactiveGroup.TransporterId, CancellationToken.None));
        });
    }

    [Test]
    public async Task PlainUser_GroupTheyDoNotBelongTo_IsNotFound()
    {
        await using var context = NewContext(nameof(PlainUser_GroupTheyDoNotBelongTo_IsNotFound));
        var fleet = await SeedAsync(context);
        var other = new Group("other", "", true, fleet.AccountId);
        await context.Groups.AddAsync(other);
        await context.SaveChangesAsync(CancellationToken.None);
        var reader = new TransporterReader(context as IApplicationDbContext, Principal(fleet.AccountId, fleet.UserId));

        Assert.Multiple(async () =>
        {
            Assert.That((await reader.GetTransportersByGroupAsync(fleet.GroupId, 0, 50, null, CancellationToken.None)).TotalCount, Is.EqualTo(1));
            Assert.ThrowsAsync<NotFoundException>(() => reader.GetTransportersByGroupAsync(other.GroupId, 0, 50, null, CancellationToken.None));
        });
    }

    [Test]
    public async Task ManagerRole_ReadsTheWholeAccount()
    {
        await using var context = NewContext(nameof(ManagerRole_ReadsTheWholeAccount));
        var fleet = await SeedAsync(context);
        var reader = new TransporterReader(context as IApplicationDbContext, Principal(fleet.AccountId, fleet.UserId, Roles.Manager));

        var page = await reader.GetTransportersByAccountAsync(fleet.AccountId, 0, 50, null, CancellationToken.None);

        Assert.That(page.TotalCount, Is.EqualTo(3));
    }

    [Test]
    public async Task VisibleReader_ForAnotherUser_UsesTheReplicatedRole_NotTheCallers()
    {
        await using var context = NewContext(nameof(VisibleReader_ForAnotherUser_UsesTheReplicatedRole_NotTheCallers));
        var fleet = await SeedAsync(context);
        var service = Principal(fleet.AccountId, null, type: PrincipalType.ServiceClient);

        var narrowed = await new VisibleTransporterReader(context as IApplicationDbContext, service)
            .GetVisibleTransporterIdsAsync(fleet.UserId, fleet.AccountId, CancellationToken.None);

        var tracked = await context.Users.AsTracking().SingleAsync(u => u.UserId == fleet.UserId);
        tracked.Role = Roles.Manager;
        await context.SaveChangesAsync(CancellationToken.None);

        var widened = await new VisibleTransporterReader(context as IApplicationDbContext, service)
            .GetVisibleTransporterIdsAsync(fleet.UserId, fleet.AccountId, CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(narrowed, Is.EquivalentTo(new[] { fleet.InGroup.TransporterId }), "a global service asking for a plain user must not inherit its own account-wide reach");
            Assert.That(widened, Has.Count.EqualTo(3), "the replicated Manager role widens the same user to the account");
        });
    }
}
