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
using TrackHub.Security.Infrastructure.Interfaces;

namespace TrackHub.Security.Infrastructure;

/// <summary>
/// Base for readers/writers that touch tenant-owned rows by key. Requests marked
/// <c>[AccountScopeEnforcedInHandler]</c> cite a <see cref="RequireAccountAccess"/> call in a
/// subclass as their load-bearing enforcement point: the row is loaded first, then its owning
/// account is checked against the caller before any data is returned or mutated. Same pattern as
/// the Manager/Telemetry <c>AccountScopedDataAccess</c> bases.
/// </summary>
public abstract class AccountScopedDataAccess(IApplicationDbContext context, ICurrentPrincipal principal)
{
    protected IApplicationDbContext Context { get; } = context;
    protected ICurrentPrincipal Principal { get; } = principal;

    /// <summary>
    /// Global service identities (client-credentials tokens with no account claim) and the platform
    /// Administrator operate across accounts; every other caller is bound to its own account.
    /// </summary>
    protected bool CanAccessAllAccounts =>
        (Principal.PrincipalType == PrincipalType.ServiceClient && !Principal.AccountId.HasValue)
        || string.Equals(Principal.Role, Roles.Administrator, StringComparison.OrdinalIgnoreCase);

    /// <summary>
    /// Asynchronous throughout: the membership fallback is a database round trip, and every caller
    /// is already async. Blocking on it held a request thread for every guard evaluation the
    /// principal check did not short-circuit.
    /// </summary>
    protected async Task<Guid> RequireAccountAccessAsync(Guid accountId, CancellationToken cancellationToken)
    {
        if (accountId == Guid.Empty)
        {
            throw new ForbiddenAccessException("Insufficient permissions. Required account access: a non-empty account id.");
        }

        if (CanAccessAllAccounts || Principal.AccountId == accountId)
        {
            return accountId;
        }

        if (Principal.PrincipalType == PrincipalType.User
            && Principal.UserId is { } userId
            && await Context.Users.AnyAsync(x => x.UserId == userId && x.AccountId == accountId, cancellationToken))
        {
            return accountId;
        }

        throw new ForbiddenAccessException($"Insufficient permissions. Required account access: {accountId}.");
    }

    protected bool CallerIsAdministrator =>
        string.Equals(Principal.Role, Roles.Administrator, StringComparison.OrdinalIgnoreCase);

    protected async Task RequireGrantableRoleAsync(int roleId, CancellationToken cancellationToken)
    {
        if (CallerIsAdministrator)
        {
            return;
        }

        var granted = await Context.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.RoleId == roleId, cancellationToken)
            ?? throw new NotFoundException(nameof(Role), roleId.ToString());

        if (string.Equals(granted.Name, Roles.Administrator, StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenAccessException("Insufficient permissions. The Administrator role can only be granted by an Administrator.");
        }

        if (await IsAncestorOfCallerRoleAsync(roleId, cancellationToken))
        {
            throw new ForbiddenAccessException($"Insufficient permissions. The '{granted.Name}' role is above the caller's own role.");
        }
    }

    protected async Task RequireGrantablePolicyAsync(int policyId, CancellationToken cancellationToken)
    {
        var policyGrants = await Context.ResourceActionPolicy
            .AsNoTracking()
            .Where(p => p.PolicyId == policyId)
            .Select(p => new { p.ResourceId, p.ActionId })
            .ToListAsync(cancellationToken);

        if (policyGrants.Count == 0)
        {
            return;
        }

        var callerGrants = await CallerResourceActionsAsync(cancellationToken);

        if (policyGrants.Exists(grant => !callerGrants.Contains((grant.ResourceId, grant.ActionId))))
        {
            throw new ForbiddenAccessException("Insufficient permissions. The policy grants a resource action the caller does not hold.");
        }
    }

    protected async Task<bool> SubjectOutranksCallerAsync(Guid subjectId, CancellationToken cancellationToken)
    {
        var subjectRoleIds = await Context.Users
            .Where(u => u.UserId == subjectId)
            .SelectMany(u => u.Roles)
            .Select(r => r.RoleId)
            .ToListAsync(cancellationToken);

        if (subjectRoleIds.Count == 0)
        {
            return false;
        }

        var administratorRoleId = await Context.Roles
            .Where(r => r.Name == Roles.Administrator)
            .Select(r => (int?)r.RoleId)
            .FirstOrDefaultAsync(cancellationToken);

        if (administratorRoleId is { } adminId && subjectRoleIds.Contains(adminId))
        {
            return !CallerIsAdministrator;
        }

        var callerRoleId = await Context.Roles
            .Where(r => r.Name == Principal.Role)
            .Select(r => (int?)r.RoleId)
            .FirstOrDefaultAsync(cancellationToken);

        if (callerRoleId is not { } callerId)
        {
            return false;
        }

        if (subjectRoleIds.Contains(callerId))
        {
            return true;
        }

        foreach (var subjectRoleId in subjectRoleIds)
        {
            if (await IsAncestorOfCallerRoleAsync(subjectRoleId, cancellationToken))
            {
                return true;
            }
        }

        return false;
    }

    private async Task<bool> IsAncestorOfCallerRoleAsync(int roleId, CancellationToken cancellationToken)
    {
        var hierarchy = await Context.Roles
            .AsNoTracking()
            .Select(r => new { r.RoleId, r.Name, r.ParentRoleId })
            .ToListAsync(cancellationToken);

        var current = hierarchy.Find(r => string.Equals(r.Name, Principal.Role, StringComparison.OrdinalIgnoreCase));
        var visited = new HashSet<int>();

        while (current?.ParentRoleId is { } parentId && visited.Add(current.RoleId))
        {
            if (parentId == roleId)
            {
                return true;
            }

            current = hierarchy.Find(r => r.RoleId == parentId);
        }

        return false;
    }

    private async Task<HashSet<(int ResourceId, int ActionId)>> CallerResourceActionsAsync(CancellationToken cancellationToken)
    {
        var fromRole = await Context.ResourceActionRole
            .AsNoTracking()
            .Where(r => r.Role.Name == Principal.Role)
            .Select(r => new { r.ResourceId, r.ActionId })
            .ToListAsync(cancellationToken);

        var fromPolicies = Principal.UserId is { } callerId
            ? await Context.ResourceActionPolicy
                .AsNoTracking()
                .Where(p => Context.UserPolicies.Any(up => up.UserId == callerId && up.PolicyId == p.PolicyId))
                .Select(p => new { p.ResourceId, p.ActionId })
                .ToListAsync(cancellationToken)
            : [];

        return [.. fromRole.Concat(fromPolicies).Select(g => (g.ResourceId, g.ActionId))];
    }
}
