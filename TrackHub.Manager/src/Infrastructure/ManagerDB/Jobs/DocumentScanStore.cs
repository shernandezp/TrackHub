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
        => await context.Documents
            .Where(d => d.ScanStatus == DocumentScanStatuses.Quarantined && d.Status != DocumentStatuses.Deleted)
            .OrderBy(d => d.LastModified)
            .Take(batchSize)
            .Select(d => new QuarantinedDocumentVm(d.DocumentId, d.AccountId, d.CurrentVersion, d.StorageKey, d.Category, d.Status))
            .ToListAsync(cancellationToken);

    public async Task<bool> JobRunSucceededAsync(string idempotencyKey, CancellationToken cancellationToken)
        => await context.BackgroundJobRuns.AnyAsync(
            r => r.JobKey == JobKey && r.IdempotencyKey == idempotencyKey && r.Status == "Succeeded", cancellationToken);

    public async Task ApplyScanResultAsync(
        QuarantinedDocumentVm document, DocumentScanOutcome outcome,
        string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        context.ChangeTracker.Clear();

        var entity = await context.Documents.FirstOrDefaultAsync(d => d.DocumentId == document.DocumentId, cancellationToken);
        if (entity is null)
        {
            return;
        }

        context.Documents.Attach(entity);
        entity.ScanStatus = outcome.ScanStatus;
        if (outcome.Activate)
        {
            entity.Status = DocumentStatuses.Active;
        }

        var version = await context.DocumentVersions.FirstOrDefaultAsync(
            v => v.DocumentId == document.DocumentId && v.VersionNumber == document.CurrentVersion, cancellationToken);
        if (version is not null)
        {
            context.DocumentVersions.Attach(version);
            version.ScanStatus = outcome.ScanStatus;
        }

        if (outcome.RaiseInfectedAlert)
        {
            context.AlertEvents.Add(new AlertEvent(
                document.AccountId, AlertEventTypes.DocumentScanFailed, AlertSeverities.High, "Documents",
                "Document", document.DocumentId.ToString(), "Open",
                $$"""{"reason":"infected","category":"{{document.Category}}"}""",
                $"document-infected:{document.DocumentId:N}:{document.CurrentVersion}"));
        }

        context.AuditEvents.Add(new AuditEvent(
            document.AccountId, "System", JobKey, "DocumentScanCompleted", "Document", document.DocumentId.ToString(),
            "Succeeded", null, $$"""{"scanStatus":"{{outcome.ScanStatus}}"}""", null, null, null, null));

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
