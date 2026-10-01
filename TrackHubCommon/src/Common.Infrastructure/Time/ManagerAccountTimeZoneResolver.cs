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

using Common.Application.Exceptions;
using Common.Application.Interfaces;
using Common.Domain.Constants;
using Common.Domain.Time;
using GraphQL;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Common.Infrastructure.Time;

/// <summary>
/// The calendar of an account, asked of Manager with the host's own service identity and cached.
/// When Manager cannot answer, the last zone it gave is used and the failure is logged and reported
/// through /health; with no zone known yet the failure propagates, because answering UTC would cut
/// every day of a non-UTC account at the wrong hour without anyone noticing. A refusal is a missing
/// grant, not an outage, so it is never covered by the last known zone.
/// </summary>
public sealed class ManagerAccountTimeZoneResolver(
    IGraphQLClientFactory graphQLClient,
    IMemoryCache cache,
    AccountTimeZoneResolverHealth health,
    ILogger<ManagerAccountTimeZoneResolver> logger)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager, asService: true)), IAccountTimeZoneResolver
{
    internal const string AccountTimeZoneQuery = @"
                query($accountId: UUID!) {
                    accountTimeZone(query: { accountId: $accountId })
                }";

    private static readonly TimeSpan CacheFor = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan KeepLastKnownFor = TimeSpan.FromHours(24);
    private static readonly TimeSpan RetryAfterFailure = TimeSpan.FromMinutes(1);

    public async Task<AccountTimeZone> ResolveAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var key = $"account-timezone:{accountId:N}";
        if (cache.TryGetValue(key, out AccountTimeZone? cached) && cached is not null)
        {
            return cached;
        }

        var refusedKey = $"account-timezone-refused:{accountId:N}";
        if (cache.TryGetValue(refusedKey, out InvalidOperationException? refused) && refused is not null)
        {
            throw refused;
        }

        var lastKnownKey = $"account-timezone-last-known:{accountId:N}";
        try
        {
            var id = await QueryAsync<string?>(
                new GraphQLRequest { Query = AccountTimeZoneQuery, Variables = new { accountId } },
                cancellationToken);
            var resolved = AccountTimeZone.For(id);
            cache.Set(key, resolved, CacheFor);
            cache.Set(lastKnownKey, resolved, KeepLastKnownFor);
            health.RecordSuccess();
            return resolved;
        }
        catch (Exception exception) when (IsRefusal(exception))
        {
            health.RecordFailure(exception);
            logger.LogCritical(exception, "Manager refused the time zone read of account {AccountId}: this service's identity lacks the AccountFeatures/Read grant or its token is rejected.", accountId);
            var configurationError = new InvalidOperationException(
                "The service identity may not read account time zones; grant it AccountFeatures/Read and check its client credentials.", exception);
            cache.Set(refusedKey, configurationError, RetryAfterFailure);
            throw configurationError;
        }
        catch (Exception exception) when (!cancellationToken.IsCancellationRequested)
        {
            health.RecordFailure(exception);
            if (cache.TryGetValue(lastKnownKey, out AccountTimeZone? lastKnown) && lastKnown is not null)
            {
                logger.LogError(exception, "Could not read the time zone of account {AccountId}; using its last known zone {Zone}.", accountId, lastKnown.Id);
                cache.Set(key, lastKnown, RetryAfterFailure);
                return lastKnown;
            }

            logger.LogError(exception, "Could not read the time zone of account {AccountId} and none is known yet.", accountId);
            throw;
        }
    }

    private static bool IsRefusal(Exception exception) => exception switch
    {
        HotChocolate.GraphQLException graphQL => graphQL.Errors.Any(e => e.Code is PlatformErrorCodes.Forbidden or PlatformErrorCodes.Unauthorized),
        GraphQL.Client.Http.GraphQLHttpRequestException http => http.StatusCode is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden,
        HttpRequestException http => http.StatusCode is System.Net.HttpStatusCode.Unauthorized or System.Net.HttpStatusCode.Forbidden,
        _ => false,
    };
}

