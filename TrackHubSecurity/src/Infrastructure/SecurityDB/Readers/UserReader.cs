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

using Common.Infrastructure;
using Common.Application.Interfaces;
using Common.Domain.Helpers;
using TrackHub.Security.Infrastructure.Interfaces;

namespace TrackHub.Security.Infrastructure.Readers;

public sealed class UserReader(IApplicationDbContext context, ICurrentPrincipal principal)
    : AccountScopedDataAccess(context, principal), IUserReader
{
    private static int PageSize(int take) => Math.Clamp(take <= 0 ? 50 : take, 1, 500);
    private static int Offset(int skip) => Math.Max(0, skip);

    public async Task<string> GetUserNameAsync(Guid id, CancellationToken cancellationToken)
        => await Context.Users
            .Where(u => u.UserId.Equals(id))
            .Select(u => u.Username)
            .FirstAsync(cancellationToken);

    public async Task<IReadOnlyCollection<UserVm>> GetUsersAsync(Filters filters, int skip, int take, CancellationToken cancellationToken)
    {
        var query = Context.Users.AsQueryable();
        query = filters.Apply(query);

        return await query
            .OrderBy(u => u.Username).ThenBy(u => u.UserId)
            .Skip(Offset(skip)).Take(PageSize(take))
            .Select(u => new UserVm(
                u.UserId,
                u.Username,
                u.EmailAddress,
                u.FirstName,
                u.SecondName,
                u.LastName,
                u.SecondSurname,
                u.DOB,
                u.LoginAttempts,
                u.LockedUntil,
                u.AccountId,
                u.Active,
                u.IntegrationUser,
                null,
                null))
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// The enforcement point the <c>[AccountScopeEnforcedInHandler]</c> marker on the by-id user
    /// requests cites: the loaded row's owning account is checked against the caller.
    /// </summary>
    public async Task<UserVm> GetUserAsync(Guid id, CancellationToken cancellationToken)
    {
        var user = await Context.Users
            .Where(u => u.UserId.Equals(id))
            .Include(role => role.Roles)
            .Include(policy => policy.Policies)
            .Select(u => new UserVm(
                u.UserId,
                u.Username,
                u.EmailAddress,
                u.FirstName,
                u.SecondName,
                u.LastName,
                u.SecondSurname,
                u.DOB,
                u.LoginAttempts,
                u.LockedUntil,
                u.AccountId,
                u.Active,
                u.IntegrationUser,
                u.Roles.Select(r => new RoleVm(r.RoleId, r.Name)).ToList(),
                u.Policies.Select(p => new PolicyVm(p.PolicyId, p.Name)).ToList()))
            .FirstOrDefaultAsync(cancellationToken);

        if (user.UserId == Guid.Empty || !await HasAccountAccessAsync(user.AccountId, cancellationToken))
        {
            throw new NotFoundException(nameof(User), id.ToString());
        }

        return user;
    }

    /// <summary>
    /// One page of the account's users plus the unpaged total; <paramref name="search"/> is applied
    /// before the window.
    /// </summary>
    public async Task<UsersPageVm> GetUsersAsync(Guid accountId, int skip, int take, string? search, CancellationToken cancellationToken)
    {
        var query = ApplySearch(Context.Users.Where(u => u.AccountId.Equals(accountId)), search);

        var totalCount = await query.CountAsync(cancellationToken);
        // The primary key makes the ordering total and the page window stable.
        var items = await query
            .Include(role => role.Roles)
            .Include(policy => policy.Policies)
            .OrderBy(u => u.Username).ThenBy(u => u.UserId)
            .Skip(skip).Take(take)
            .Select(u => new UserVm(
                u.UserId,
                u.Username,
                u.EmailAddress,
                u.FirstName,
                u.SecondName,
                u.LastName,
                u.SecondSurname,
                u.DOB,
                u.LoginAttempts,
                u.LockedUntil,
                u.AccountId,
                u.Active,
                u.IntegrationUser,
                u.Roles.Select(r => new RoleVm(r.RoleId, r.Name)).ToList(),
                u.Policies.Select(p => new PolicyVm(p.PolicyId, p.Name)).ToList()))
            .ToListAsync(cancellationToken);

        return new UsersPageVm(items, totalCount);
    }

    // The users screen searches the columns it renders: the username and e-mail in the first
    // column, and the two name columns beside them.
    private static IQueryable<User> ApplySearch(IQueryable<User> query, string? search)
    {
        if (string.IsNullOrWhiteSpace(search))
        {
            return query;
        }

        var term = SearchPattern.Contains(search);
        return query.Where(u => EF.Functions.ILike(u.Username, term, SearchPattern.Escape)
            || EF.Functions.ILike(u.EmailAddress, term, SearchPattern.Escape)
            || EF.Functions.ILike(u.FirstName, term, SearchPattern.Escape)
            || EF.Functions.ILike(u.LastName, term, SearchPattern.Escape));
    }

    public async Task<IReadOnlyCollection<UserVm>> GetUsersByRoleAsync(Guid accountId, int roleId, CancellationToken cancellationToken)
    {
        return await Context.Users
            .Where(u => u.AccountId == accountId && u.Roles.Any(r => r.RoleId == roleId))
            .Include(u => u.Roles)
            .Select(u => new UserVm(
                u.UserId,
                u.Username,
                u.EmailAddress,
                u.FirstName,
                u.SecondName,
                u.LastName,
                u.SecondSurname,
                u.DOB,
                u.LoginAttempts,
                u.LockedUntil,
                u.AccountId,
                u.Active,
                u.IntegrationUser,
                null,
                null))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<UserVm>> GetUsersByPolicyAsync(Guid accountId, int policyId, CancellationToken cancellationToken)
    {
        return await Context.Users
            .Where(u => u.AccountId == accountId && u.Policies.Any(r => r.PolicyId == policyId))
            .Include(u => u.Policies)
            .Select(u => new UserVm(
                u.UserId,
                u.Username,
                u.EmailAddress,
                u.FirstName,
                u.SecondName,
                u.LastName,
                u.SecondSurname,
                u.DOB,
                u.LoginAttempts,
                u.LockedUntil,
                u.AccountId,
                u.Active,
                u.IntegrationUser,
                null,
                null))
            .ToListAsync(cancellationToken);
    }

    /// <summary>
    /// Minimal projection of the account's members holding a role, for the allocator dialogs.
    /// Returns up to <paramref name="fetchSize"/> rows so the caller can detect an over-ceiling set.
    /// </summary>
    public async Task<IReadOnlyCollection<UserLookupVm>> GetUserLookupByRoleAsync(Guid accountId, int roleId, int fetchSize, CancellationToken cancellationToken)
        => await LookupOrdered(Context.Users.Where(u => u.AccountId == accountId && u.Roles.Any(r => r.RoleId == roleId)), fetchSize)
            .ToListAsync(cancellationToken);

    /// <summary>
    /// Minimal projection of the account's members holding a policy, for the allocator dialogs.
    /// </summary>
    public async Task<IReadOnlyCollection<UserLookupVm>> GetUserLookupByPolicyAsync(Guid accountId, int policyId, int fetchSize, CancellationToken cancellationToken)
        => await LookupOrdered(Context.Users.Where(u => u.AccountId == accountId && u.Policies.Any(p => p.PolicyId == policyId)), fetchSize)
            .ToListAsync(cancellationToken);

    /// <summary>
    /// Minimal projection of every member of the account — the other operand of the allocator's set
    /// difference.
    /// </summary>
    public async Task<IReadOnlyCollection<UserLookupVm>> GetUserLookupByAccountAsync(Guid accountId, int fetchSize, CancellationToken cancellationToken)
        => await LookupOrdered(Context.Users.Where(u => u.AccountId == accountId), fetchSize)
            .ToListAsync(cancellationToken);

    private static IQueryable<UserLookupVm> LookupOrdered(IQueryable<TrackHub.Security.Infrastructure.Entities.User> query, int fetchSize)
        => query
            .OrderBy(u => u.Username)
            .ThenBy(u => u.UserId)
            .Take(fetchSize)
            .Select(u => new UserLookupVm(u.UserId, u.Username));

    public async Task<bool> ValidateEmailAddressAsync(string emailAddress, CancellationToken cancellationToken)
        => !await Context.Users
            .Where(u => u.EmailAddress == Common.Domain.Helpers.EmailAddresses.Normalize(emailAddress))
            .AnyAsync(cancellationToken);

    public async Task<bool> ValidateEmailAddressAsync(Guid userId, string emailAddress, CancellationToken cancellationToken)
        => !await Context.Users
            .Where(u => !u.UserId.Equals(userId) && u.EmailAddress == Common.Domain.Helpers.EmailAddresses.Normalize(emailAddress))
            .AnyAsync(cancellationToken);

    public async Task<bool> ValidateUsernameAsync(Guid userId, string username, CancellationToken cancellationToken)
        => !await Context.Users
            .Where(u => !u.UserId.Equals(userId) && u.Username.Equals(username))
            .AnyAsync(cancellationToken);

    public async Task<bool> IsAdminAsync(Guid userId, CancellationToken cancellationToken)
        => await Context.Users
            .Where(u => u.UserId == userId)
            .SelectMany(u => u.Roles)
            .AnyAsync(r => r.ParentRoleId == null, cancellationToken);

    public async Task<bool> IsManagerAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await Context.Users
            .Where(u => u.UserId == userId)
            .SelectMany(u => u.Roles)
            .AnyAsync(r => Context.Roles
                .Where(pr => pr.RoleId == r.ParentRoleId && pr.ParentRoleId == null)
                .Any(), cancellationToken);
    }

    public async Task<bool> IsManagerAsync(Guid userId, Guid managerId, CancellationToken cancellationToken)
    {
        var user = await Context.Users.FindAsync([userId], cancellationToken)
            ?? throw new NotFoundException(nameof(User), $"{userId}");

        var isSameAccountManager = await Context.Users
            .Where(u => u.UserId == managerId && u.AccountId == user.AccountId)
            .SelectMany(u => u.Roles)
            .SelectMany(r => Context.Roles
                .Where(pr => pr.RoleId == r.ParentRoleId && pr.ParentRoleId == null))
            .AnyAsync(cancellationToken);

        return isSameAccountManager && !await SubjectOutranksCallerAsync(userId, cancellationToken);
    }

}
