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
using Common.Domain.Extensions;
using Microsoft.EntityFrameworkCore;
using TrackHub.Security.Infrastructure;
using TrackHub.Security.Infrastructure.Entities;
using TrackHub.Security.Infrastructure.Interfaces;
using TrackHub.Security.Infrastructure.Writers;
using TrackHub.Security.Domain.Interfaces;
using TrackHub.Security.Domain.Records;

namespace Infrastructure.UnitTests;

// Every credential change that must end live sessions re-stamps the credential; the AuthorityServer
// compares the token's security_stamp against the row on authorize and refresh.
[TestFixture]
public class DriverIdentityWriterTests
{
    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    private static DriverIdentityWriter NewWriter(ApplicationDbContext context, bool driverBelongsToAccount = true)
    {
        var principal = new Mock<ICurrentPrincipal>();
        principal.SetupGet(p => p.PrincipalType).Returns(PrincipalType.ServiceClient);
        principal.SetupGet(p => p.AccountId).Returns((Guid?)null);
        var drivers = new Mock<IManagerDriverReader>();
        drivers.Setup(d => d.DriverBelongsToAccountAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(driverBelongsToAccount);
        return new DriverIdentityWriter(context as IApplicationDbContext, principal.Object, drivers.Object);
    }

    private static async Task<DriverCredential> SeedAsync(ApplicationDbContext context, Guid driverId, Guid accountId, string login)
    {
        var credential = new DriverCredential(driverId, accountId, login, "secret".HashPassword(), active: true) { VerifiedAt = DateTimeOffset.UtcNow };
        await context.DriverCredentials.AddAsync(credential);
        await context.SaveChangesAsync(CancellationToken.None);
        return credential;
    }

    private static async Task<DriverCredential> ReloadAsync(ApplicationDbContext context, Guid credentialId)
        => await context.DriverCredentials.AsNoTracking().SingleAsync(x => x.DriverCredentialId == credentialId);

    [Test]
    public async Task CreateCredential_ForADriverOfAnotherAccount_IsNotFound()
    {
        await using var context = NewContext(nameof(CreateCredential_ForADriverOfAnotherAccount_IsNotFound));
        var writer = NewWriter(context, driverBelongsToAccount: false);
        var dto = new DriverCredentialDto(Guid.NewGuid(), Guid.NewGuid(), "driver1", "secret", Active: true, ResetRequired: false);

        Assert.ThrowsAsync<NotFoundException>(() => writer.CreateDriverCredentialAsync(dto, CancellationToken.None));
        Assert.That(await context.DriverCredentials.CountAsync(), Is.Zero);
    }

    [Test]
    public async Task Lock_Reset_Activate_EachReStampTheCredential()
    {
        await using var context = NewContext(nameof(Lock_Reset_Activate_EachReStampTheCredential));
        var credential = await SeedAsync(context, Guid.NewGuid(), Guid.NewGuid(), "DRIVER1");
        var writer = NewWriter(context);
        var stamps = new List<Guid> { credential.SecurityStamp };

        await writer.LockDriverCredentialAsync(credential.DriverCredentialId, DateTimeOffset.UtcNow.AddMinutes(15), CancellationToken.None);
        stamps.Add((await ReloadAsync(context, credential.DriverCredentialId)).SecurityStamp);

        await writer.ResetDriverCredentialAsync(credential.DriverCredentialId, "new-secret", resetRequired: true, CancellationToken.None);
        stamps.Add((await ReloadAsync(context, credential.DriverCredentialId)).SecurityStamp);

        await writer.ActivateDriverCredentialAsync(credential.DriverCredentialId, "final-secret", CancellationToken.None);
        stamps.Add((await ReloadAsync(context, credential.DriverCredentialId)).SecurityStamp);

        Assert.That(stamps.Distinct().Count(), Is.EqualTo(stamps.Count), "each change must invalidate the sessions issued before it");
    }

    [Test]
    public async Task Revoke_DeactivatesAndReStamps()
    {
        await using var context = NewContext(nameof(Revoke_DeactivatesAndReStamps));
        var credential = await SeedAsync(context, Guid.NewGuid(), Guid.NewGuid(), "DRIVER1");
        var before = credential.SecurityStamp;

        await NewWriter(context).RevokeDriverCredentialAsync(credential.DriverCredentialId, CancellationToken.None);

        var stored = await ReloadAsync(context, credential.DriverCredentialId);
        Assert.Multiple(() =>
        {
            Assert.That(stored.Active, Is.False);
            Assert.That(stored.SecurityStamp, Is.Not.EqualTo(before));
        });
    }

    [Test]
    public async Task RevokeAll_EndsEveryLiveCredentialOfTheDriver_AndOnlyThose()
    {
        await using var context = NewContext(nameof(RevokeAll_EndsEveryLiveCredentialOfTheDriver_AndOnlyThose));
        var accountId = Guid.NewGuid();
        var driverId = Guid.NewGuid();
        var first = await SeedAsync(context, driverId, accountId, "DRIVER1");
        var second = await SeedAsync(context, driverId, accountId, "DRIVER2");
        var otherDriver = await SeedAsync(context, Guid.NewGuid(), accountId, "OTHER");
        var otherAccount = await SeedAsync(context, driverId, Guid.NewGuid(), "ELSEWHERE");

        await NewWriter(context).RevokeDriverCredentialsAsync(driverId, accountId, CancellationToken.None);

        Assert.Multiple(async () =>
        {
            Assert.That((await ReloadAsync(context, first.DriverCredentialId)).Active, Is.False);
            Assert.That((await ReloadAsync(context, second.DriverCredentialId)).Active, Is.False);
            Assert.That((await ReloadAsync(context, otherDriver.DriverCredentialId)).Active, Is.True, "another driver's credential is untouched");
            Assert.That((await ReloadAsync(context, otherAccount.DriverCredentialId)).Active, Is.True, "the same driver id in another account is untouched");
        });
    }
}
