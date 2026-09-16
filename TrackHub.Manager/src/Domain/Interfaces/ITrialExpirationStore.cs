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

namespace TrackHub.Manager.Domain.Interfaces;

public readonly record struct TrialFeatureVm(string? Tier, DateTimeOffset? EffectiveTo, string? ConfigurationJson);

public interface ITrialExpirationStore
{
    Task<IReadOnlyCollection<Guid>> GetTrialAccountsAsync(CancellationToken cancellationToken);

    Task<IReadOnlyCollection<TrialFeatureVm>> GetAccountFeaturesAsync(Guid accountId, CancellationToken cancellationToken);

    Task<bool> JobRunSucceededAsync(string idempotencyKey, CancellationToken cancellationToken);

    /// <summary>
    /// Suspends the account, audits the transition and records the run in one commit. False when the
    /// status changed between selection and now, so the caller leaves it alone.
    /// </summary>
    Task<bool> SuspendAsync(
        Guid accountId, string reason, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken);

    Task RecordFailureAsync(
        Guid accountId, string idempotencyKey, DateTimeOffset startedAt,
        string errorCode, string errorMessage, CancellationToken cancellationToken);
}
