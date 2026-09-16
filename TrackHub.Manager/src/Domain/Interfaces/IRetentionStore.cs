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

public interface IDeliveryRetentionStore
{
    Task<int> DeleteCompletedDeliveriesAsync(DateTimeOffset cutoff, CancellationToken cancellationToken);

    Task RecordJobRunAsync(string resourceKey, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken);
}

public interface IPlatformRetentionStore
{
    /// <summary>Succeeded rows past the cutoff, except the durable idempotency markers and the newest row per job key.</summary>
    Task<int> DeleteAgedJobRunsAsync(DateTimeOffset cutoff, IReadOnlyCollection<string> durableMarkerJobKeys, CancellationToken cancellationToken);

    /// <summary>Resolved events last seen before the cutoff that no delivery row still points at.</summary>
    Task<int> DeleteAgedResolvedAlertEventsAsync(DateTimeOffset cutoff, CancellationToken cancellationToken);

    Task RecordJobRunAsync(string resourceKey, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken);
}

public readonly record struct PurgeableVersionVm(
    Guid DocumentVersionId, Guid DocumentId, Guid AccountId, int VersionNumber, string StorageKey);

public interface IDocumentRetentionStore
{
    Task<IReadOnlyCollection<PurgeableVersionVm>> GetPurgeableVersionsAsync(
        DateTimeOffset cutoff, int batchSize, CancellationToken cancellationToken);

    Task<bool> HasLegalHoldAsync(Guid documentId, CancellationToken cancellationToken);

    /// <summary>The purge stamp, its audit event and its job run, written together so a replay cannot double-count.</summary>
    Task RecordPurgeAsync(
        PurgeableVersionVm version, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken);
}
