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
using TrackHub.Security.Domain.Records;
using TrackHub.Security.Infrastructure.Interfaces;

namespace TrackHub.Security.Infrastructure.Writers;

// The TARGET user's owning account is checked against the caller before a grant is written or
// removed — the enforcement point the [AccountScopeEnforcedInHandler] markers on the user-policy
// commands cite.
public sealed class UserPolicyWriter(IApplicationDbContext context, ICurrentPrincipal principal)
    : AccountScopedDataAccess(context, principal), IUserPolicyWriter
{
    public async Task<UserPolicyVm> CreateUserPolicyAsync(UserPolicyDto userPolicyDto, CancellationToken cancellationToken)
    {
        await RequireTargetUserAccessAsync(userPolicyDto.UserId, cancellationToken);
        await RequireGrantablePolicyAsync(userPolicyDto.PolicyId, cancellationToken);

        var userPolicy = new UserPolicy
        {
            UserId = userPolicyDto.UserId,
            PolicyId = userPolicyDto.PolicyId
        };

        await Context.UserPolicies.AddAsync(userPolicy, cancellationToken);

        await Context.SaveChangesAsync(cancellationToken);

        return new UserPolicyVm(
            userPolicy.UserId,
            userPolicy.PolicyId);
    }

    public async Task DeleteUserPolicyAsync(Guid userId, int policyId, CancellationToken cancellationToken)
    {
        await RequireTargetUserAccessAsync(userId, cancellationToken);

        var userPolicy = await Context.UserPolicies.FindAsync([policyId, userId], cancellationToken)
            ?? throw new NotFoundException(nameof(UserPolicy), $"{userId},{policyId}");

        Context.UserPolicies.Attach(userPolicy);
        Context.UserPolicies.Remove(userPolicy);

        await Context.SaveChangesAsync(cancellationToken);
    }

    private Task RequireTargetUserAccessAsync(Guid userId, CancellationToken cancellationToken)
        => RequireUserForChangeAsync(userId, cancellationToken);
}
