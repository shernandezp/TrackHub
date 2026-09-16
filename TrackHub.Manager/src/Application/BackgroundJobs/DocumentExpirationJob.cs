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

using System.Text.Json;
using Microsoft.Extensions.Logging;
using TrackHub.Manager.Domain.Constants;

namespace TrackHub.Manager.Application.BackgroundJobs;

/// <summary>
/// Raises exactly one DocumentExpiring per (document, threshold) across the 30/15/7-day bands and a
/// DocumentExpired past due, then transitions the document. Skips accounts without the `documents`
/// feature — this is a billing surface, unlike the scan job.
/// </summary>
public sealed class DocumentExpirationJob(
    IAccountFeatureGate features,
    IDocumentExpirationStore store,
    IAlertRuleEvaluator evaluator,
    ILogger<DocumentExpirationJob> logger) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromHours(12);
    public static TimeSpan StartupDelay => TimeSpan.FromMinutes(2);

    public const string ExpiredThreshold = "expired";

    public async Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var enabledAccounts = await features.EnabledAccountsAsync(FeatureKeys.Documents, now, cancellationToken);
        if (enabledAccounts.Count == 0)
        {
            return;
        }

        var horizon = now.AddDays(DocumentLimits.ExpirationThresholdsDays.Max());
        var candidates = await store.GetExpiringAsync(enabledAccounts, horizon, cancellationToken);

        var expiringRaised = 0;
        var expiredRaised = 0;

        foreach (var document in candidates)
        {
            var threshold = ThresholdFor(document.ExpiresAt, now);
            if (threshold is null)
            {
                continue;
            }

            // One bad document must not abandon the rest of the batch until the next tick.
            try
            {
                if (!await TryRaiseAsync(document, threshold, now, cancellationToken))
                {
                    continue;
                }

                if (threshold == ExpiredThreshold)
                {
                    expiredRaised++;
                }
                else
                {
                    expiringRaised++;
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to raise the expiration alert for document {DocumentId}; continuing the batch.", document.DocumentId);
            }
        }

        logger.LogInformation("Document expiration cycle: {Expiring} expiring alert(s), {Expired} expired alert(s) across {Accounts} account(s).",
            expiringRaised, expiredRaised, enabledAccounts.Count);
    }

    /// <summary>
    /// The nearest crossed band, so a document that entered the 7-day window never later back-fires
    /// the 15/30-day alerts. Null when no band applies yet.
    /// </summary>
    public static string? ThresholdFor(DateTimeOffset expiresAt, DateTimeOffset now)
    {
        if (expiresAt <= now)
        {
            return ExpiredThreshold;
        }

        var daysLeft = (expiresAt - now).TotalDays;
        var crossed = DocumentLimits.ExpirationThresholdsDays.Where(t => daysLeft <= t).ToList();
        return crossed.Count == 0 ? null : crossed.Min().ToString();
    }

    // The idempotency marker is written LAST, after the fan-out and the Active -> Expired transition
    // have both succeeded. Writing it first burned the key before the work was known to have happened,
    // and the key carries no date, so a throw in between stranded the document forever. The alert event
    // is deduplicated and the evaluator suppresses a repeat delivery for one it already fanned out, so
    // a retry after a partial failure resumes rather than duplicating.
    private async Task<bool> TryRaiseAsync(
        ExpiringDocumentVm document, string threshold, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var idempotencyKey = $"{document.DocumentId:N}:{threshold}";
        if (await store.JobRunSucceededAsync(idempotencyKey, cancellationToken))
        {
            return false;
        }

        var isExpired = threshold == ExpiredThreshold;
        var eventType = isExpired ? AlertEventTypes.DocumentExpired : AlertEventTypes.DocumentExpiring;

        var alertEvent = await store.RecordDedupedAlertAsync(new AlertEventDto(
            document.AccountId,
            eventType,
            isExpired ? AlertSeverities.High : AlertSeverities.Warning,
            "Documents",
            "Document",
            document.DocumentId.ToString(),
            "Open",
            JsonSerializer.Serialize(new { threshold, category = document.Category, expiresAt = document.ExpiresAt }),
            $"{eventType}:{document.DocumentId:N}:{threshold}"), cancellationToken);

        await evaluator.EvaluateAsync(alertEvent, cancellationToken);
        await store.CompleteAsync(document.DocumentId, document.AccountId, isExpired, idempotencyKey, now, cancellationToken);
        return true;
    }
}
