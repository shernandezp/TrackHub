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

using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Jobs;

public sealed class AccountFeatureGate(IApplicationDbContext context) : IAccountFeatureGate
{
    public async Task<IReadOnlyCollection<Guid>> EnabledAccountsAsync(
        string featureKey, DateTimeOffset now, CancellationToken cancellationToken)
        => await InEffect(featureKey, now).Select(f => f.AccountId).Distinct().ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<Guid>> EnabledActiveAccountsAsync(
        string featureKey, DateTimeOffset now, CancellationToken cancellationToken)
        => await InEffect(featureKey, now)
            .Where(f => context.Accounts.Any(a => a.AccountId == f.AccountId && a.Active))
            .Select(f => f.AccountId)
            .Distinct()
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<Guid>> EnabledAmongAsync(
        IReadOnlyCollection<Guid> accountIds, string featureKey, DateTimeOffset now, CancellationToken cancellationToken)
        => await InEffect(featureKey, now)
            .Where(f => accountIds.Contains(f.AccountId))
            .Select(f => f.AccountId)
            .Distinct()
            .ToListAsync(cancellationToken);

    private IQueryable<Entities.AccountFeature> InEffect(string featureKey, DateTimeOffset now)
        => context.AccountFeatures
            .Where(f => f.FeatureKey == featureKey && f.Enabled
                && (f.EffectiveFrom == null || f.EffectiveFrom <= now)
                && (f.EffectiveTo == null || f.EffectiveTo >= now));
}
