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

using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace TrackHub.Router.Infrastructure.ManagerApi;

public class AccountReader(IGraphQLClientFactory graphQLClient, IMemoryCache cache)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager, asService: true)), IAccountReader
{
    // Fallback cadence (seconds) when the gps.integration feature omits a storing interval.
    private const int DefaultStoringIntervalSeconds = 360;

    // The three worker loops ask for this set every 10 and 60 seconds for data that changes rarely.
    // The same TTL the request path uses for derived feature flags, so a toggle still takes effect
    // within a minute everywhere.
    private static readonly TimeSpan AccountsCacheTtl = TimeSpan.FromSeconds(60);
    private const string AccountsCacheKey = "router:accounts-to-sync";

    // Master feeds are read a page at a time; the Manager caps a page at MasterPageSize rows.
    private const int MasterPageSize = 500;

    // Single source of truth for the queries this reader sends; the
    // ServiceContracts tests validate these exact strings against the Manager schema.
    internal const string AccountsToSyncQuery = @"
                query($filter: FiltersInput!, $skip: Int!, $take: Int!) {
                    accountSettingsMaster(
                        query: { filter: $filter, skip: $skip, take: $take }
                      ) {
                            accountId
                       }
                }";

    internal const string ValidateFeatureEnabledQuery = @"
                query($accountId: UUID!, $featureKey: String!) {
                    validateFeatureEnabled(query: { accountId: $accountId, featureKey: $featureKey })
                }";

    internal const string AllAccountFeaturesQuery = @"
                query($skip: Int!, $take: Int!) {
                    allAccountFeaturesMaster(query: { skip: $skip, take: $take }) {
                        accountId
                        featureKey
                        enabled
                        effectiveFrom
                        effectiveTo
                        configurationJson
                    }
                }";

    public async Task<IEnumerable<AccountSettingsVm>> GetAccountsToSyncAsync(CancellationToken cancellationToken)
    {
        if (cache.TryGetValue(AccountsCacheKey, out IReadOnlyCollection<AccountSettingsVm>? cached) && cached is not null)
        {
            return cached;
        }

        var accounts = await ReadAccountsAsync(cancellationToken);
        var featuresByAccount = (await ReadAllFeaturesAsync(cancellationToken))
            .GroupBy(f => f.AccountId)
            .ToDictionary(g => g.Key, g => (IReadOnlyCollection<AccountFeatureStateVm>)g
                .Select(f => new AccountFeatureStateVm(f.FeatureKey, f.Enabled, f.EffectiveFrom, f.EffectiveTo, f.ConfigurationJson))
                .ToList());

        var resolved = accounts
            .Select(account => BuildAccountSettings(account, featuresByAccount.GetValueOrDefault(account.AccountId, [])))
            .ToList();

        cache.Set(AccountsCacheKey, (IReadOnlyCollection<AccountSettingsVm>)resolved, AccountsCacheTtl);
        return resolved;
    }

    private async Task<List<AccountSettingsVm>> ReadAccountsAsync(CancellationToken cancellationToken)
    {
        var accounts = new List<AccountSettingsVm>();
        for (var skip = 0; ; skip += MasterPageSize)
        {
            var request = new GraphQLRequest
            {
                Query = AccountsToSyncQuery,
                Variables = new
                {
                    filter = new
                    {
                        filters = Array.Empty<object>()
                    },
                    skip,
                    take = MasterPageSize
                }
            };
            var page = await QueryAsync<IReadOnlyCollection<AccountSettingsVm>>(request, cancellationToken);
            accounts.AddRange(page);
            if (page.Count < MasterPageSize)
            {
                return accounts;
            }
        }
    }

    private async Task<List<AccountFeatureMasterStateVm>> ReadAllFeaturesAsync(CancellationToken cancellationToken)
    {
        var features = new List<AccountFeatureMasterStateVm>();
        for (var skip = 0; ; skip += MasterPageSize)
        {
            var request = new GraphQLRequest
            {
                Query = AllAccountFeaturesQuery,
                Variables = new { skip, take = MasterPageSize }
            };
            var page = await QueryAsync<IReadOnlyCollection<AccountFeatureMasterStateVm>>(request, cancellationToken);
            features.AddRange(page);
            if (page.Count < MasterPageSize)
            {
                return features;
            }
        }
    }

    public async Task<bool> IsFeatureEnabledAsync(Guid accountId, string featureKey, CancellationToken cancellationToken)
    {
        var request = new GraphQLRequest
        {
            Query = ValidateFeatureEnabledQuery,
            Variables = new
            {
                accountId,
                featureKey
            }
        };

        return await QueryAsync<bool>(request, cancellationToken);
    }

    private static AccountSettingsVm BuildAccountSettings(AccountSettingsVm account, IReadOnlyCollection<AccountFeatureStateVm> features)
        => new(
            account.AccountId,
            ResolveStoringInterval(features),
            IsFeatureEnabled(features, FeatureKeys.Geofencing),
            IsFeatureEnabled(features, FeatureKeys.TripManagement),
            IsFeatureEnabled(features, FeatureKeys.GpsIntegration),
            IsFeatureEnabled(features, FeatureKeys.GpsPositionHistory));

    private static bool IsFeatureEnabled(IEnumerable<AccountFeatureStateVm> features, string featureKey)
    {
        var now = DateTimeOffset.UtcNow;
        return features.Any(feature =>
            feature.FeatureKey == featureKey
            && feature.Enabled
            && (!feature.EffectiveFrom.HasValue || feature.EffectiveFrom <= now)
            && (!feature.EffectiveTo.HasValue || feature.EffectiveTo >= now));
    }

    // Storing cadence is a storage/cost setting owned by the SuperAdministrator and stored in the
    // gps.integration feature configuration ("storingIntervalSeconds").
    private static int ResolveStoringInterval(IEnumerable<AccountFeatureStateVm> features)
    {
        var integration = features.FirstOrDefault(f => f.FeatureKey == FeatureKeys.GpsIntegration);
        if (!string.IsNullOrWhiteSpace(integration.ConfigurationJson))
        {
            try
            {
                var doc = JsonDocument.Parse(integration.ConfigurationJson!);
                if (doc.RootElement.TryGetProperty("storingIntervalSeconds", out var value)
                    && value.TryGetInt32(out var seconds)
                    && seconds > 0)
                {
                    return seconds;
                }
            }
            catch (JsonException)
            {
                // fall through to default
            }
        }
        return DefaultStoringIntervalSeconds;
    }

    private readonly record struct AccountFeatureStateVm(
        string FeatureKey,
        bool Enabled,
        DateTimeOffset? EffectiveFrom,
        DateTimeOffset? EffectiveTo,
        string? ConfigurationJson);

    private readonly record struct AccountFeatureMasterStateVm(
        Guid AccountId,
        string FeatureKey,
        bool Enabled,
        DateTimeOffset? EffectiveFrom,
        DateTimeOffset? EffectiveTo,
        string? ConfigurationJson);
}
