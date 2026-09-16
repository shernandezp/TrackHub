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

using Microsoft.Extensions.Logging;
using TrackHub.Manager.Domain.Constants;

namespace TrackHub.Manager.Application.BackgroundJobs;

/// <summary>
/// Runs the AV scanner over Quarantined documents and transitions them to Clean (Active), Infected or
/// Failed. Infected files stay undownloadable and raise a deduplicated alert. A security job, so it
/// runs regardless of the `documents` feature.
/// </summary>
public sealed class DocumentScanJob(
    IDocumentScanStore store,
    IDocumentScanner scanner,
    ILogger<DocumentScanJob> logger) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromSeconds(30);
    public static TimeSpan StartupDelay => TimeSpan.FromSeconds(10);

    public const int BatchSize = 100;

    public async Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var pending = await store.GetQuarantinedAsync(BatchSize, cancellationToken);

        foreach (var document in pending)
        {
            var idempotencyKey = $"scan:{document.DocumentId:N}:{document.CurrentVersion}";
            var startedAt = DateTimeOffset.UtcNow;
            try
            {
                if (await store.JobRunSucceededAsync(idempotencyKey, cancellationToken))
                {
                    continue;
                }

                var scanStatus = await scanner.ScanAsync(document.StorageKey, cancellationToken);
                await store.ApplyScanResultAsync(document, Classify(document, scanStatus), idempotencyKey, startedAt, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Scan failed for document {DocumentId}.", document.DocumentId);
                await RecordFailureAsync(document, idempotencyKey, startedAt, ex, cancellationToken);
            }
        }

        if (pending.Count > 0)
        {
            logger.LogInformation("Document scan cycle processed {Count} quarantined document(s).", pending.Count);
        }
    }

    public static DocumentScanOutcome Classify(QuarantinedDocumentVm document, string scanStatus)
        => new(
            scanStatus,
            string.Equals(scanStatus, DocumentScanStatuses.Clean, StringComparison.OrdinalIgnoreCase)
                && document.Status == DocumentStatuses.Uploaded,
            string.Equals(scanStatus, DocumentScanStatuses.Infected, StringComparison.OrdinalIgnoreCase));

    private async Task RecordFailureAsync(
        QuarantinedDocumentVm document, string idempotencyKey, DateTimeOffset startedAt, Exception ex, CancellationToken cancellationToken)
    {
        try
        {
            await store.RecordFailureAsync(
                document.DocumentId, document.AccountId, $"{idempotencyKey}:failed:{startedAt:O}", startedAt,
                ex.GetType().Name, ex.Message, cancellationToken);
        }
        catch (Exception recordEx) when (recordEx is not OperationCanceledException)
        {
            logger.LogError(recordEx, "Failed to record scan failure for document {DocumentId}.", document.DocumentId);
        }
    }
}
