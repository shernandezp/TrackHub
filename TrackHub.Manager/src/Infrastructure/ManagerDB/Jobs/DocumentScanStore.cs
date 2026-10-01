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

using Common.Domain.Constants;
using TrackHub.Manager.Domain.Constants;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Jobs;

public sealed class DocumentScanStore(IApplicationDbContext context) : IDocumentScanStore
{
    private const string JobKey = BackgroundJobKeys.DocumentScan;

    public async Task<IReadOnlyCollection<QuarantinedDocumentVm>> GetQuarantinedAsync(int batchSize, CancellationToken cancellationToken)
        => await (from version in context.DocumentVersions
                  join document in context.Documents on version.DocumentId equals document.DocumentId
                  where version.ScanStatus == DocumentScanStatuses.Quarantined && document.Status != DocumentStatuses.Deleted
                  orderby version.CreatedAt, version.DocumentVersionId
                  select new QuarantinedDocumentVm(
                      document.DocumentId, document.AccountId, version.VersionNumber, version.StorageKey, document.Category, document.Status))
            .Take(batchSize)
            .ToListAsync(cancellationToken);


    public async Task<bool> JobRunSucceededAsync(string idempotencyKey, CancellationToken cancellationToken)
        => await context.BackgroundJobRuns.AnyAsync(
            r => r.JobKey == JobKey && r.IdempotencyKey == idempotencyKey && r.Status == "Succeeded", cancellationToken);

    public async Task ApplyScanResultAsync(
        QuarantinedDocumentVm document, DocumentScanOutcome outcome,
        string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        context.ChangeTracker.Clear();

        var version = await context.DocumentVersions
            .AsTracking().FirstOrDefaultAsync(
            v => v.DocumentId == document.DocumentId && v.VersionNumber == document.VersionNumber, cancellationToken);
        if (version is null)
        {
            return;
        }

        version.ScanStatus = outcome.ScanStatus;

        // A version uploaded while this one was being scanned is the current one now; its own
        // verdict, not this one, decides what the document serves.
        var entity = await context.Documents
            .AsTracking().FirstOrDefaultAsync(
            d => d.DocumentId == document.DocumentId && d.CurrentVersion == document.VersionNumber, cancellationToken);
        if (entity is not null)
        {
            entity.ScanStatus = outcome.ScanStatus;
            if (outcome.Activate)
            {
                entity.Status = DocumentStatuses.Active;
            }
        }

        context.AuditEvents.Add(new AuditEvent(
            document.AccountId, "System", JobKey, "DocumentScanCompleted", "Document", document.DocumentId.ToString(),
            "Succeeded", null, $$"""{"scanStatus":"{{outcome.ScanStatus}}","version":{{document.VersionNumber}}}""", null, null, null, null));

        context.BackgroundJobRuns.Add(new BackgroundJobRun(
            JobKey, document.AccountId, document.DocumentId.ToString(), idempotencyKey, "Succeeded", 1, startedAt)
        {
            CompletedAt = DateTimeOffset.UtcNow,
        });

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RecordFailureAsync(
        Guid documentId, Guid accountId, string idempotencyKey, DateTimeOffset startedAt,
        string errorCode, string errorMessage, CancellationToken cancellationToken)
    {
        context.ChangeTracker.Clear();
        context.BackgroundJobRuns.Add(new BackgroundJobRun(
            JobKey, accountId, documentId.ToString(), idempotencyKey, "Failed", 1, startedAt)
        {
            CompletedAt = DateTimeOffset.UtcNow,
            ErrorCode = errorCode,
            ErrorMessage = errorMessage,
        });
        await context.SaveChangesAsync(cancellationToken);
    }
}
