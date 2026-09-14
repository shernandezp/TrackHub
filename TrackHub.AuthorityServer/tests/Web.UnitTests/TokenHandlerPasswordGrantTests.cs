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

using System.Security.Claims;
using OpenIddict.Abstractions;
using TrackHub.AuthorityServer.Domain.Models;
using TrackHub.AuthorityServer.Web.Endpoints;

namespace TrackHub.AuthorityServer.Web.UnitTests;

[TestFixture]
public class TokenHandlerPasswordGrantTests
{
    private static UserVm User(Guid userId, Guid accountId) => new(
        userId, "admin", string.Empty, "email@mail.com", DateTimeOffset.UtcNow, true, 0, null, accountId);

    [Test]
    public void CreateUserPrincipal_CarriesTheUserClaimsForTheAccessToken()
    {
        var userId = Guid.NewGuid();
        var accountId = Guid.NewGuid();

        var principal = TokenHandler.CreateUserPrincipal(User(userId, accountId), "Administrator");

        Assert.Multiple(() =>
        {
            Assert.That(principal.FindFirst(OpenIddictConstants.Claims.Subject)?.Value, Is.EqualTo(userId.ToString()));
            Assert.That(principal.FindFirst("principal_type")?.Value, Is.EqualTo("User"));
            Assert.That(principal.FindFirst("user_id")?.Value, Is.EqualTo(userId.ToString()));
            Assert.That(principal.FindFirst("account_id")?.Value, Is.EqualTo(accountId.ToString()));
            Assert.That(principal.FindFirst(ClaimTypes.Role)?.Value, Is.EqualTo("Administrator"));
            Assert.That(principal.Claims.All(c => c.GetDestinations().Contains(OpenIddictConstants.Destinations.AccessToken)), Is.True);
        });
    }

    [Test]
    public void CreateUserPrincipal_UserWithoutRole_OmitsTheRoleClaim()
    {
        var principal = TokenHandler.CreateUserPrincipal(User(Guid.NewGuid(), Guid.NewGuid()), null);

        Assert.That(principal.FindFirst(ClaimTypes.Role), Is.Null);
    }
}
