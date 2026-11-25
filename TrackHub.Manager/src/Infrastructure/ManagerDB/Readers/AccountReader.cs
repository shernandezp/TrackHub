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

using Common.Infrastructure;
using Common.Domain.Time;
using Common.Application.Interfaces;
using Common.Domain.Enums;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Readers;

public sealed class AccountReader(IApplicationDbContext context, ICurrentPrincipal principal)
    : AccountScopedDataAccess(context, principal), IAccountReader
{
    public async Task<AccountVm> GetAccountAsync(Guid id, CancellationToken cancellationToken)
    {
        // By-id tenant guard that [AccountScopeEnforcedInHandler] on GetAccountQuery relies on: the
        // id IS the account, so access is checked before the row is read.
        RequireAccountAccess(id);

        var found = await Context.Accounts
            .Where(a => a.AccountId.Equals(id))
            .Select(a => new AccountVm(
                a.AccountId,
                a.Name,
                a.Description,
                (AccountType)a.Type,
                a.Type,
                (AccountStatus)a.Status,
                a.Status,
                a.Active,
                a.TimeZoneId,
                a.LastModified, a.Version))
            .FirstOrDefaultAsync(cancellationToken);
        ReaderResults.EnsureFound(found, nameof(Entities.Account), id.ToString());
        return found;
    }

    public async Task<AccountsPageVm> GetAccountsAsync(int skip, int take, string? search, CancellationToken cancellationToken)
    {
        var query = Context.Accounts.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = SearchPattern.Contains(search);
            query = query.Where(a => EF.Functions.ILike(a.Name, term, SearchPattern.Escape));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        // Account names are not constrained unique, so AccountId is what makes the ordering total.
        var items = await query
            .OrderBy(a => a.Name)
            .ThenBy(a => a.AccountId)
            .Skip(skip)
            .Take(take)
            .Select(a => new AccountVm(
                a.AccountId,
                a.Name,
                a.Description,
                (AccountType)a.Type,
                a.Type,
                (AccountStatus)a.Status,
                a.Status,
                a.Active,
                a.TimeZoneId,
                a.LastModified, a.Version))
            .ToListAsync(cancellationToken);

        return new AccountsPageVm(items, totalCount);
    }

    public async Task<string> GetTimeZoneAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var scopedAccountId = RequireAccountAccess(accountId);
        return await Context.Accounts
            .Where(a => a.AccountId == scopedAccountId)
            .Select(a => a.TimeZoneId)
            .FirstOrDefaultAsync(cancellationToken) ?? AccountTimeZone.DefaultId;
    }
}
