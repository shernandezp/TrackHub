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
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Common.Infrastructure;

// Feature flags for services whose DbContext sits on the Manager database: the same effective-window
// predicate as Manager's own service, read with raw SQL so any context can host it. A missing row is
// disabled.
public sealed class DbFeatureFlagService(DbContext context, IMemoryCache cache) : IFeatureFlagService
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(30);

    public async Task<bool> IsEnabledAsync(Guid accountId, string featureKey, CancellationToken cancellationToken)
    {
        if (accountId == Guid.Empty || string.IsNullOrWhiteSpace(featureKey))
        {
            return false;
        }

        var cacheKey = $"feature-flag:{accountId:N}:{featureKey}";
        if (cache.TryGetValue<bool>(cacheKey, out var cached))
        {
            return cached;
        }

        var now = DateTimeOffset.UtcNow;
        var rows = await context.Database
            .SqlQuery<bool>($"""
                SELECT TRUE AS "Value"
                FROM app.account_features
                WHERE accountid = {accountId}
                  AND featurekey = {featureKey}
                  AND enabled = TRUE
                  AND (effectivefrom IS NULL OR effectivefrom <= {now})
                  AND (effectiveto IS NULL OR effectiveto >= {now})
                LIMIT 1
                """)
            .ToListAsync(cancellationToken);

        var enabled = rows.Count > 0;
        cache.Set(cacheKey, enabled, CacheTtl);
        return enabled;
    }
}
