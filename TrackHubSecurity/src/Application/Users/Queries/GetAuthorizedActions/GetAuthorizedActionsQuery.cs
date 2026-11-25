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

namespace TrackHub.Security.Application.Users.Queries.GetAuthorizedActions;

[Authorize(Resource = Resources.Accounts, Action = Actions.Read)]
// Enforcement: the handler resolves the TARGET user through UserReader.GetUserAsync, whose
// RequireAccountAccess check binds the caller to the target's owning account.
[AccountScopeEnforcedInHandler]
[AllowSuspendedAccount]
public readonly record struct GetAuthorizedActionsQuery(Guid UserId) : IRequest<IReadOnlyCollection<ResourceActionVm>>;

public class GetAuthorizedActionsQueryHandler(
    IUserReader userReader,
    IUserRoleReader userRoleReader,
    IUserPolicyReader userPolicyReader,
    IResourceActionRoleReader resourceActionRoleReader,
    IResourceActionPolicyReader resourceActionPolicyReader) : IRequestHandler<GetAuthorizedActionsQuery, IReadOnlyCollection<ResourceActionVm>>
{
    public async Task<IReadOnlyCollection<ResourceActionVm>> Handle(GetAuthorizedActionsQuery request, CancellationToken cancellationToken)
    {
        // Tenant guard: resolving the target user enforces caller access to its owning account.
        _ = await userReader.GetUserAsync(request.UserId, cancellationToken);

        var userRoles = await userRoleReader.GetUserRolesIdsAsync(request.UserId, cancellationToken);

        var userPolicies = await userPolicyReader.GetUserPolicyIdsAsync(request.UserId, cancellationToken);

        var roleAuthorizedActions = await resourceActionRoleReader.GetRoleAuthorizedActionsAsync(userRoles, cancellationToken);

        var policyAuthorizedActions = await resourceActionPolicyReader.GetPolicyAuthorizedActionsAsync(userPolicies, cancellationToken);

        var allAuthorizedActions = roleAuthorizedActions.Union(policyAuthorizedActions).Distinct().ToList();

        return allAuthorizedActions;
    }

}
