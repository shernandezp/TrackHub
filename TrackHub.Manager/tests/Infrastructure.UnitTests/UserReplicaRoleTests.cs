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
using TrackHub.Manager.Domain.Records;
using TrackHub.Manager.Infrastructure;
using TrackHub.Manager.Infrastructure.Interfaces;
using TrackHub.Manager.Infrastructure.ManagerDB.Writers;

namespace Infrastructure.UnitTests;

[TestFixture]
public class UserReplicaRoleTests
{
    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    private static ICurrentPrincipal Service()
    {
        var principal = new Mock<ICurrentPrincipal>();
        principal.SetupGet(p => p.PrincipalType).Returns(PrincipalType.ServiceClient);
        principal.SetupGet(p => p.AccountId).Returns((Guid?)null);
        return principal.Object;
    }

    [Test]
    public async Task TheReplicaCarriesTheRoleSecurityMirrors()
    {
        await using var context = NewContext(nameof(TheReplicaCarriesTheRoleSecurityMirrors));
        var accountId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var writer = new UserWriter(context as IApplicationDbContext, Service());

        await writer.CreateUserAsync(new UserDto(userId, "alice", true, accountId, Roles.User), CancellationToken.None);
        Assert.That((await context.Users.AsNoTracking().SingleAsync()).Role, Is.EqualTo(Roles.User));

        await writer.UpdateUserAsync(new UpdateUserDto(userId, "alice", true, Roles.Manager), CancellationToken.None);
        Assert.That((await context.Users.AsNoTracking().SingleAsync()).Role, Is.EqualTo(Roles.Manager));
    }
}
