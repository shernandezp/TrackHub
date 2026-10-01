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

using Common.Domain.Time;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace Common.Infrastructure.Time;

// Reads app.accounts directly: no service grant to forget, and a failed read throws instead of answering UTC.
public sealed class DbAccountTimeZoneResolver(DbContext context, IMemoryCache cache) : IAccountTimeZoneResolver
{
    private static readonly TimeSpan CacheFor = TimeSpan.FromMinutes(10);

    public async Task<AccountTimeZone> ResolveAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var key = $"account-timezone:{accountId:N}";
        if (cache.TryGetValue(key, out AccountTimeZone? cached) && cached is not null)
        {
            return cached;
        }

        var rows = await context.Database
            .SqlQuery<string?>($"SELECT timezoneid AS \"Value\" FROM app.accounts WHERE id = {accountId}")
            .ToListAsync(cancellationToken);

        var resolved = AccountTimeZone.For(rows.Count > 0 ? rows[0] : null);
        cache.Set(key, resolved, CacheFor);
        return resolved;
    }
}

public static class DbAccountTimeZoneResolverExtensions
{
    public static IServiceCollection AddDatabaseAccountTimeZones<TContext>(this IServiceCollection services)
        where TContext : DbContext
    {
        services.AddMemoryCache();
        services.RemoveAll<IAccountTimeZoneResolver>();
        services.AddScoped<IAccountTimeZoneResolver>(sp => new DbAccountTimeZoneResolver(
            sp.GetRequiredService<TContext>(), sp.GetRequiredService<IMemoryCache>()));
        return services;
    }
}
