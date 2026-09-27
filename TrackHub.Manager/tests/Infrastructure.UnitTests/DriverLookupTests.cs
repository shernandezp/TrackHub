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
using Moq;
using TrackHub.Manager.Infrastructure;
using TrackHub.Manager.Infrastructure.Interfaces;
using TrackHub.Manager.Infrastructure.ManagerDB.Readers;

namespace Infrastructure.UnitTests;

// The trip board's picker: names and ids only, active drivers on search, any named driver by id.
[TestFixture]
public class DriverLookupTests
{
    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    private static DriverReader Reader(ApplicationDbContext context, Guid accountId)
    {
        var principal = new Mock<ICurrentPrincipal>();
        principal.SetupGet(p => p.AccountId).Returns(accountId);
        principal.SetupGet(p => p.PrincipalType).Returns(PrincipalType.User);
        return new DriverReader(context as IApplicationDbContext, principal.Object);
    }

    private static Driver Seed(Guid accountId, string name, bool active)
        => new(accountId, name, "+57300000000", "CC", "1", active, null, null, null, null);

    [Test]
    public async Task Search_ReturnsActiveDriversOnly_ByIds_ReturnsTheNamedOnesEvenWhenInactive()
    {
        await using var context = NewContext(nameof(Search_ReturnsActiveDriversOnly_ByIds_ReturnsTheNamedOnesEvenWhenInactive));
        var accountId = Guid.NewGuid();
        var ana = Seed(accountId, "Ana Ruiz", true);
        var retired = Seed(accountId, "Andres Retired", false);
        var other = Seed(Guid.NewGuid(), "Ana Other", true);
        await context.Drivers.AddRangeAsync(ana, retired, other);
        await context.SaveChangesAsync(CancellationToken.None);
        var reader = Reader(context, accountId);

        var search = await reader.GetDriverLookupAsync(accountId, null, null, 50, CancellationToken.None);
        var byIds = await reader.GetDriverLookupAsync(accountId, null, [retired.DriverId, other.DriverId], 50, CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(search.Select(d => d.DriverId), Is.EquivalentTo(new[] { ana.DriverId }), "the picker feed offers the active drivers of the caller's account");
            Assert.That(byIds.Select(d => d.DriverId), Is.EquivalentTo(new[] { retired.DriverId }), "the board names an inactive driver but never another account's");
            Assert.That(byIds.Single().Active, Is.False);
        });
    }
}
