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
using Common.Domain.Constants;
using Moq;
using TrackHub.Manager.Domain.Records;
using TrackHub.Manager.Infrastructure;
using TrackHub.Manager.Infrastructure.ManagerDB.Writers;

namespace Infrastructure.UnitTests;

[TestFixture]
public class DriverDuplicateGuardTests
{
    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    private static ICurrentPrincipal Administrator(Guid accountId)
    {
        var principal = new Mock<ICurrentPrincipal>();
        principal.SetupGet(x => x.AccountId).Returns(accountId);
        principal.SetupGet(x => x.PrincipalType).Returns(PrincipalType.User);
        principal.SetupGet(x => x.UserId).Returns(Guid.NewGuid());
        principal.SetupGet(x => x.Role).Returns(Roles.Administrator);
        return principal.Object;
    }

    [Test]
    public async Task TheSameDocument_ConflictsWhileActive_AndBringsBackADeactivatedDriver()
    {
        using var context = NewContext(nameof(TheSameDocument_ConflictsWhileActive_AndBringsBackADeactivatedDriver));
        var accountId = Guid.NewGuid();
        var writer = new DriverWriter(context, Administrator(accountId));
        DriverDto Dto(string name) => new(accountId, name, null, "CC", "1020", true, null, null, null, null);

        var created = await writer.CreateDriverAsync(Dto("Ana"), CancellationToken.None);
        await Assert.ThrowsAsync<ConflictException>(() => writer.CreateDriverAsync(Dto("Ana B"), CancellationToken.None));

        await writer.DeactivateDriverAsync(created.DriverId, CancellationToken.None);
        context.ChangeTracker.Clear();
        var revived = await writer.CreateDriverAsync(Dto("Ana C"), CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(revived.DriverId, Is.EqualTo(created.DriverId));
            Assert.That(revived.Active, Is.True);
            Assert.That(revived.Name, Is.EqualTo("Ana C"));
            Assert.That(context.Drivers.Count(), Is.EqualTo(1));
        });
    }

    [Test]
    public async Task Update_NormalizesTheDocument_AndRefusesAnotherDriversNumber()
    {
        using var context = NewContext(nameof(Update_NormalizesTheDocument_AndRefusesAnotherDriversNumber));
        var accountId = Guid.NewGuid();
        var writer = new DriverWriter(context, Administrator(accountId));
        DriverDto Dto(string name, string? document) => new(accountId, name, null, "CC", document, true, null, null, null, null);

        var ana = await writer.CreateDriverAsync(Dto("Ana", "1020"), CancellationToken.None);
        var beto = await writer.CreateDriverAsync(Dto("Beto", "2030"), CancellationToken.None);
        var carla = await writer.CreateDriverAsync(Dto("Carla", "3040"), CancellationToken.None);
        context.ChangeTracker.Clear();

        await writer.UpdateDriverAsync(beto.DriverId, Dto("Beto", ""), CancellationToken.None);
        context.ChangeTracker.Clear();
        await writer.UpdateDriverAsync(carla.DriverId, Dto("Carla", "  "), CancellationToken.None);
        context.ChangeTracker.Clear();

        await Assert.MultipleAsync(async () =>
        {
            Assert.That(context.Drivers.Where(d => d.DriverId != ana.DriverId).Select(d => d.DocumentNumber), Is.All.Null);
            await Assert.ThrowsAsync<ConflictException>(() => writer.UpdateDriverAsync(beto.DriverId, Dto("Beto", " 1020 "), CancellationToken.None));
        });
    }
}
