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

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TrackHub.Manager.Application.BackgroundJobs;

/// <summary>
/// Reclaims the stored bytes of document versions that are superseded or belong to a Voided/Deleted
/// document once the retention window has passed. Metadata rows are retained for audit and the
/// current bytes of an Active document are never touched. Retention ENFORCEMENT policy, legal holds
/// and regulatory export packaging are owned by spec 24; this job only reclaims storage and honors
/// the legal-hold hook. A security/cleanup job, so it runs regardless of the `documents` feature.
/// </summary>
public sealed class DocumentRetentionCleanupJob(
    IDocumentRetentionStore store,
    IDocumentStorage storage,
    IConfiguration configuration,
    ILogger<DocumentRetentionCleanupJob> logger) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromHours(24);
    public static TimeSpan StartupDelay => TimeSpan.FromMinutes(10);

    public const int DefaultRetentionDays = 1825;
    public const int BatchSize = 200;

    public async Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var retentionDays = configuration.GetValue<int?>("DocumentStorage:RetentionDays") ?? DefaultRetentionDays;
        var eligible = await store.GetPurgeableVersionsAsync(now.AddDays(-Math.Max(0, retentionDays)), BatchSize, cancellationToken);

        var purged = 0;
        foreach (var version in eligible)
        {
            if (await store.HasLegalHoldAsync(version.DocumentId, cancellationToken))
            {
                continue;
            }

            try
            {
                // Idempotent: a no-op when the object is already gone.
                await storage.DeleteAsync(version.StorageKey, cancellationToken);
                await store.RecordPurgeAsync(
                    version, $"retention:{version.DocumentVersionId:N}", DateTimeOffset.UtcNow, cancellationToken);
                purged++;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Retention cleanup failed for document version {VersionId}.", version.DocumentVersionId);
            }
        }

        if (purged > 0)
        {
            logger.LogInformation("Document retention cleanup purged bytes for {Count} version(s).", purged);
        }
    }
}
