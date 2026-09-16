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

public readonly record struct QuarantinedDocumentVm(
    Guid DocumentId, Guid AccountId, int CurrentVersion, string StorageKey, string Category, string Status);

/// <summary>What the scan result means for the document, decided by the caller.</summary>
public readonly record struct DocumentScanOutcome(string ScanStatus, bool Activate, bool RaiseInfectedAlert);

public interface IDocumentScanStore
{
    Task<IReadOnlyCollection<QuarantinedDocumentVm>> GetQuarantinedAsync(int batchSize, CancellationToken cancellationToken);

    Task<bool> JobRunSucceededAsync(string idempotencyKey, CancellationToken cancellationToken);

    /// <summary>
    /// The document's scan status and state transition, the current version's status, the infected
    /// alert, the audit event and the job run, written as one commit. Starts from a clean change
    /// tracker so a document that failed earlier in the batch cannot be flushed under this one.
    /// </summary>
    Task ApplyScanResultAsync(
        QuarantinedDocumentVm document, DocumentScanOutcome outcome,
        string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken);

    Task RecordFailureAsync(
        Guid documentId, Guid accountId, string idempotencyKey, DateTimeOffset startedAt,
        string errorCode, string errorMessage, CancellationToken cancellationToken);
}
