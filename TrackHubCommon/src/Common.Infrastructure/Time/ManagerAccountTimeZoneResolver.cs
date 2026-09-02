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

using Common.Application.Interfaces;
using Common.Domain.Constants;
using Common.Domain.Time;
using GraphQL;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Common.Infrastructure.Time;

/// <summary>
/// The calendar of an account, asked of Manager with the host's own service identity and cached.
/// The query sits behind the <c>AccountFeatures/Read</c> permission every service client already
/// holds for its feature flags, so no new grant is needed. An unreachable Manager answers UTC for
/// a while rather than failing the request: a day boundary off by a few hours beats a 500.
/// </summary>
public sealed class ManagerAccountTimeZoneResolver(
    IGraphQLClientFactory graphQLClient,
    IMemoryCache cache,
    ILogger<ManagerAccountTimeZoneResolver> logger)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager, asService: true)), IAccountTimeZoneResolver
{
    internal const string AccountTimeZoneQuery = @"
                query($accountId: UUID!) {
                    accountTimeZone(query: { accountId: $accountId })
                }";

    private static readonly TimeSpan CacheFor = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan CacheFailureFor = TimeSpan.FromMinutes(1);

    public async Task<AccountTimeZone> ResolveAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var key = $"account-timezone:{accountId:N}";
        if (cache.TryGetValue(key, out AccountTimeZone? cached) && cached is not null)
        {
            return cached;
        }

        AccountTimeZone resolved;
        TimeSpan ttl;
        try
        {
            var id = await QueryAsync<string?>(
                new GraphQLRequest { Query = AccountTimeZoneQuery, Variables = new { accountId } },
                cancellationToken);
            resolved = AccountTimeZone.For(id);
            ttl = CacheFor;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception, "Could not read the time zone of account {AccountId}; using UTC for now.", accountId);
            resolved = AccountTimeZone.Utc;
            ttl = CacheFailureFor;
        }

        cache.Set(key, resolved, ttl);
        return resolved;
    }
}
