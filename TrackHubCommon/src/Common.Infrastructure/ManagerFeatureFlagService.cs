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
using Common.Domain.Constants;
using GraphQL;
using Microsoft.Extensions.Caching.Memory;

namespace Common.Infrastructure;

// Feature flags for services that do not map Manager's app.account_features: the
// validateFeatureEnabled probe under the host's own service identity. A transport failure fails
// closed (the exception propagates), so a Manager outage never opens a gated surface.
public sealed class ManagerFeatureFlagService(IGraphQLClientFactory graphQLClient, IMemoryCache cache)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager, asService: true)), IFeatureFlagService
{
    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(30);

    internal const string ValidateFeatureEnabledQuery = @"
                query($accountId: UUID!, $featureKey: String!) {
                    validateFeatureEnabled(query: { accountId: $accountId, featureKey: $featureKey })
                }";

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

        var request = new GraphQLRequest
        {
            Query = ValidateFeatureEnabledQuery,
            Variables = new { accountId, featureKey }
        };
        var enabled = await QueryAsync<bool>(request, cancellationToken);

        cache.Set(cacheKey, enabled, CacheTtl);
        return enabled;
    }
}
