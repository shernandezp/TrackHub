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

/// <summary>
/// Which accounts currently hold a feature. Every background job is a billing surface or a platform
/// one, so each needs this and none of them should own its own copy of the effective-window query.
/// </summary>
public interface IAccountFeatureGate
{
    Task<IReadOnlyCollection<Guid>> EnabledAccountsAsync(
        string featureKey, DateTimeOffset now, CancellationToken cancellationToken);

    /// <summary>As <see cref="EnabledAccountsAsync"/>, but suspended accounts are excluded too.</summary>
    Task<IReadOnlyCollection<Guid>> EnabledActiveAccountsAsync(
        string featureKey, DateTimeOffset now, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<Guid>> EnabledAmongAsync(
        IReadOnlyCollection<Guid> accountIds, string featureKey, DateTimeOffset now, CancellationToken cancellationToken);
}
