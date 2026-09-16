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

public readonly record struct ExpiringDocumentVm(Guid DocumentId, Guid AccountId, string Category, DateTimeOffset ExpiresAt);

public interface IDocumentExpirationStore
{
    Task<IReadOnlyCollection<ExpiringDocumentVm>> GetExpiringAsync(
        IReadOnlyCollection<Guid> accountIds, DateTimeOffset horizon, CancellationToken cancellationToken);

    Task<bool> JobRunSucceededAsync(string idempotencyKey, CancellationToken cancellationToken);

    /// <summary>
    /// Deduplicates on (AccountId, DeduplicationKey, Status != Resolved) the way AlertEventWriter does,
    /// and persists before the caller fans out so the deliveries can carry the alert event id.
    /// </summary>
    Task<AlertEventVm> RecordDedupedAlertAsync(AlertEventDto alertEvent, CancellationToken cancellationToken);

    /// <summary>
    /// The Active → Expired transition and the idempotency marker, written last: the marker carries no
    /// date, so burning it before the work was known to have happened would strand the document forever.
    /// </summary>
    Task CompleteAsync(
        Guid documentId, Guid accountId, bool markExpired, string idempotencyKey,
        DateTimeOffset startedAt, CancellationToken cancellationToken);
}
