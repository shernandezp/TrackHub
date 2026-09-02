/**
 * Copyright (c) 2025 Sergio Hernandez. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

using Common.Domain.Time;
using Microsoft.Extensions.Caching.Memory;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Readers;

/// <summary>
/// Manager owns the accounts table, so its own calendar lookups read it directly instead of
/// calling itself over GraphQL. Internal plumbing on behalf of an account the caller is already
/// acting for, hence no scope check here; the caller-facing query goes through
/// <see cref="AccountReader.GetTimeZoneAsync"/>.
/// </summary>
public sealed class AccountTimeZoneResolver(IApplicationDbContext context, IMemoryCache cache) : IAccountTimeZoneResolver
{
    private static readonly TimeSpan CacheFor = TimeSpan.FromMinutes(10);

    public async Task<AccountTimeZone> ResolveAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var key = $"account-timezone:{accountId:N}";
        if (cache.TryGetValue(key, out AccountTimeZone? cached) && cached is not null)
        {
            return cached;
        }

        var id = await context.Accounts
            .Where(a => a.AccountId == accountId)
            .Select(a => a.TimeZoneId)
            .FirstOrDefaultAsync(cancellationToken);

        var resolved = AccountTimeZone.For(id);
        cache.Set(key, resolved, CacheFor);
        return resolved;
    }
}
