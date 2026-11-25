// Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

namespace TrackHub.Security.Infrastructure.Identity;

public class IdentityService(IUserReader userReader,
    IResourceActionRoleReader resourceActionRoleReader,
    IResourceActionPolicyReader resourceActionPolicyReader,
    IUserRoleReader userRoleReader,
    IUserPolicyReader userPolicyReader,
    IClientReader clientReader,
    IServiceClientPermissionReader serviceClientPermissionReader) : IIdentityService
{
    public async Task<string> GetUserNameAsync(Guid userId, CancellationToken token)
        => await userReader.GetUserNameAsync(userId, token);

    public async Task<bool> IsInRoleAsync(Guid userId, string resource, string action, CancellationToken token)
    {
        var resourceActionRoles = await resourceActionRoleReader.GetResourceActionRolesAsync(resource, action, token);
        var userRoles = await userRoleReader.GetUserRoleNamesAsync(userId, token);
        return resourceActionRoles.Any(role => userRoles.Contains(role));
    }

    // Policies are additive GRANTS, not restrictions: true when the user holds AT LEAST ONE policy
    // mapped to this resource/action. A resource-action with no policy rows grants nothing extra and
    // returns false, so the role stays the only path unless a policy is deliberately attached. This
    // is the per-user elevation lever: one user is raised above their role without widening it.
    public async Task<bool> AuthorizeAsync(Guid userId, string resource, string action, CancellationToken token)
    {
        var resourceActionPolicies = await resourceActionPolicyReader.GetResourceActionPoliciesAsync(resource, action, token);
        if (resourceActionPolicies.Count == 0)
        {
            return false;
        }
        var userPolicies = await userPolicyReader.GetUserPolicyNamesAsync(userId, token);
        return resourceActionPolicies.Any(userPolicies.Contains);
    }

    // Role OR policy — either path alone is sufficient.
    public async Task<bool> AuthorizeUserAsync(Guid userId, string resource, string action, CancellationToken token)
        => await IsInRoleAsync(userId, resource, action, token)
           || await AuthorizeAsync(userId, resource, action, token);

    public async Task<bool> IsValidServiceAsync(string? client, CancellationToken token)
        => client != null && await clientReader.IsValidClientAsync(client, token);

    public async Task<bool> IsValidServiceAsync(string? client, string resource, string action, Guid? accountId, IReadOnlyCollection<string> scopes, IReadOnlyCollection<string> audiences, CancellationToken token)
        => client != null
           && await clientReader.IsValidClientAsync(client, token)
           && await serviceClientPermissionReader.HasPermissionAsync(client, resource, action, accountId, scopes, audiences, token);

}
