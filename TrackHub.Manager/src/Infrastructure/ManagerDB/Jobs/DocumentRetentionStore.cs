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

public sealed class DocumentRetentionStore(IApplicationDbContext context) : IDocumentRetentionStore
{
    // Eligible = not yet purged, superseded by a newer version or belonging to a Voided/Deleted
    // document, and past the retention window measured from the parent's last state change
    // (replace/void/delete time — NOT the version's original creation, which would purge prematurely).
    public async Task<IReadOnlyCollection<PurgeableVersionVm>> GetPurgeableVersionsAsync(
        DateTimeOffset cutoff, int batchSize, CancellationToken cancellationToken)
        => await (
            from v in context.DocumentVersions
            join d in context.Documents on v.DocumentId equals d.DocumentId
            where v.BytesPurgedAt == null
                && d.LastModified <= cutoff
                && (v.VersionNumber < d.CurrentVersion
                    || d.Status == DocumentStatuses.Voided
                    || d.Status == DocumentStatuses.Deleted)
            orderby v.CreatedAt
            select new PurgeableVersionVm(v.DocumentVersionId, v.DocumentId, v.AccountId, v.VersionNumber, v.StorageKey))
            .Take(batchSize)
            .ToListAsync(cancellationToken);

    // Placeholder for spec 24's legal-hold model; no holds exist yet, so nothing is withheld.
    public Task<bool> HasLegalHoldAsync(Guid documentId, CancellationToken cancellationToken)
        => Task.FromResult(false);

    public async Task RecordPurgeAsync(
        PurgeableVersionVm version, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        var entity = await context.DocumentVersions
            .AsTracking()
            .FirstOrDefaultAsync(v => v.DocumentVersionId == version.DocumentVersionId, cancellationToken);
        if (entity is null)
        {
            return;
        }

        entity.BytesPurgedAt = DateTimeOffset.UtcNow;

        context.AuditEvents.Add(new AuditEvent(
            version.AccountId, "System", BackgroundJobKeys.DocumentRetentionCleanup, "DocumentBytesPurged",
            "DocumentVersion", version.DocumentVersionId.ToString(), "Succeeded", null,
            $$"""{"documentId":"{{version.DocumentId}}","versionNumber":{{version.VersionNumber}}}""",
            null, null, null, null));

        context.BackgroundJobRuns.Add(new BackgroundJobRun(
            BackgroundJobKeys.DocumentRetentionCleanup, version.AccountId, version.DocumentId.ToString(),
            idempotencyKey, "Succeeded", 1, startedAt)
        {
            CompletedAt = DateTimeOffset.UtcNow,
        });

        await context.SaveChangesAsync(cancellationToken);
    }
}
