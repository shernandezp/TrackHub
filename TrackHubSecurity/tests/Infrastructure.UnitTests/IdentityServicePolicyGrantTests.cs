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

using TrackHub.Security.Domain.Interfaces;
using TrackHub.Security.Infrastructure.Identity;

namespace Infrastructure.UnitTests;

// Pins POLICIES AS ADDITIVE GRANTS (role OR policy): attaching a policy must never revoke a
// resource/action from users who do not hold it.
[TestFixture]
public class IdentityServicePolicyGrantTests
{
    private const string Resource = "Trips";
    private const string Action = "Delete";
    private static readonly Guid UserId = Guid.NewGuid();

    private static IdentityService Build(
        string[] rolesGrantingResourceAction,
        string[] usersRoles,
        string[] policiesOnResourceAction,
        string[] usersPolicies)
    {
        var resourceActionRoles = new Mock<IResourceActionRoleReader>();
        resourceActionRoles
            .Setup(x => x.GetResourceActionRolesAsync(Resource, Action, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rolesGrantingResourceAction);

        var userRoles = new Mock<IUserRoleReader>();
        userRoles
            .Setup(x => x.GetUserRoleNamesAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usersRoles);

        var resourceActionPolicies = new Mock<IResourceActionPolicyReader>();
        resourceActionPolicies
            .Setup(x => x.GetResourceActionPoliciesAsync(Resource, Action, It.IsAny<CancellationToken>()))
            .ReturnsAsync(policiesOnResourceAction);

        var userPolicies = new Mock<IUserPolicyReader>();
        userPolicies
            .Setup(x => x.GetUserPolicyNamesAsync(UserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(usersPolicies);

        return new IdentityService(
            new Mock<IUserReader>().Object,
            resourceActionRoles.Object,
            resourceActionPolicies.Object,
            userRoles.Object,
            userPolicies.Object,
            new Mock<IClientReader>().Object,
            new Mock<IServiceClientPermissionReader>().Object);
    }

    private static Task<bool> Authorize(IdentityService service)
        => service.AuthorizeUserAsync(UserId, Resource, Action, CancellationToken.None);

    [Test]
    public async Task RoleGrant_WithNoPolicyAttached_Authorizes()
    {
        var service = Build(["Manager"], ["Manager"], [], []);

        Assert.That(await Authorize(service), Is.True);
    }

    [Test]
    public async Task PolicyGrant_AloneAuthorizes_WhenTheRoleDoesNot()
    {
        var service = Build(["Manager"], ["User"], ["TripDeleters"], ["TripDeleters"]);

        Assert.That(await Authorize(service), Is.True);
    }

    [Test]
    public async Task UnheldPolicy_DoesNotAuthorize_WhenTheRoleDoesNot()
    {
        var service = Build(["Manager"], ["User"], ["TripDeleters"], []);

        Assert.That(await Authorize(service), Is.False);
    }

    [Test]
    public async Task AttachingAPolicy_DoesNotRevokeAnExistingRoleGrant()
    {
        var service = Build(["Manager"], ["Manager"], ["TripDeleters"], []);

        Assert.That(await Authorize(service), Is.True);
    }

    [Test]
    public async Task HoldingOneOfSeveralAttachedPolicies_Authorizes()
    {
        var service = Build(["Manager"], ["User"], ["TripDeleters", "FleetAdmins"], ["FleetAdmins"]);

        Assert.That(await Authorize(service), Is.True);
    }

    [Test]
    public async Task NeitherRoleNorPolicy_Denies()
    {
        var service = Build(["Manager"], ["User"], [], []);

        Assert.That(await Authorize(service), Is.False);
    }
}
