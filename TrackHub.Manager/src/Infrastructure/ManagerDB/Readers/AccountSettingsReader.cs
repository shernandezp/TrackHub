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
using Common.Domain.Enums;
using Common.Domain.Helpers;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Readers;

public sealed class AccountSettingsReader(IApplicationDbContext context, ICurrentPrincipal principal)
    : AccountScopedDataAccess(context, principal), IAccountSettingsReader
{
    public async Task<AccountSettingsVm> GetAccountSettingsAsync(Guid id, CancellationToken cancellationToken)
    {
        // By-id tenant guard that [AccountScopeEnforcedInHandler] on GetAccountSettingsQuery relies on.
        RequireAccountAccess(id);

        var accountSettings = await Context.AccountSettings
            .Where(a => a.AccountId.Equals(id))
            .FirstOrDefaultAsync(cancellationToken);
        ReaderResults.EnsureFound(accountSettings, nameof(Entities.AccountSettings), id.ToString());

        return ToVm(accountSettings);
    }

    public async Task<IReadOnlyCollection<AccountSettingsVm>> GetAccountSettingsAsync(Filters filters, int skip, int take, CancellationToken cancellationToken)
    {
        // Every per-account call made for a non-operational tenant is refused downstream.
        var query = Context.AccountSettings
            .Where(a => Context.Accounts.Any(x => x.AccountId == a.AccountId
                && (x.Status == (short)AccountStatus.Trial || x.Status == (short)AccountStatus.Active)));
        query = filters.Apply(query);

        var settings = await query
            // total-order: accountid is the primary key of account_settings, so it is already unique.
            .OrderBy(a => a.AccountId)
            .Skip(skip).Take(take)
            .ToListAsync(cancellationToken);
        var result = new List<AccountSettingsVm>();

        foreach (var accountSettings in settings)
        {
            result.Add(ToVm(accountSettings));
        }

        return result;
    }

    private static AccountSettingsVm ToVm(AccountSettings accountSettings)
        => new(
            accountSettings.AccountId,
            accountSettings.Maps,
            accountSettings.MapsKey,
            accountSettings.OnlineInterval,
            accountSettings.RefreshMap,
            accountSettings.RefreshMapInterval,
            accountSettings.Version);
}
