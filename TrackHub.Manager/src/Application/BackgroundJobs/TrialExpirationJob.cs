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
using Common.Domain.Enums;
using Microsoft.Extensions.Logging;
using TrackHub.Manager.Application.Accounts.Events;

namespace TrackHub.Manager.Application.BackgroundJobs;

/// <summary>
/// Transitions Trial accounts past their trial-end to Suspended and raises AccountStatusChanged.
/// Trial-end is read from AccountFeature configuration (`trialEndsAt`) or a trial-tier feature's
/// EffectiveTo; a no-op when no trial-end data exists.
/// </summary>
public sealed class TrialExpirationJob(
    ITrialExpirationStore store,
    IPublisher publisher,
    ILogger<TrialExpirationJob> logger) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromHours(6);
    public static TimeSpan StartupDelay => TimeSpan.FromMinutes(5);

    public const string JobKey = BackgroundJobKeys.TrialExpiration;
    public const string TrialTier = "trial";
    public const string SuspensionReason = "Trial period expired.";

    public async Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var trialAccounts = await store.GetTrialAccountsAsync(cancellationToken);

        var suspended = 0;
        foreach (var accountId in trialAccounts)
        {
            var trialEnd = ResolveTrialEnd(await store.GetAccountFeaturesAsync(accountId, cancellationToken));
            if (trialEnd is null || trialEnd.Value > now)
            {
                continue;
            }

            var idempotencyKey = $"trial-expire:{accountId:N}:{trialEnd.Value:yyyyMMdd}";
            if (await store.JobRunSucceededAsync(idempotencyKey, cancellationToken))
            {
                continue;
            }

            try
            {
                if (!await store.SuspendAsync(accountId, SuspensionReason, idempotencyKey, now, cancellationToken))
                {
                    continue;
                }

                await publisher.Publish(new AccountStatusChanged.Notification(
                    accountId, AccountStatus.Trial, AccountStatus.Suspended, SuspensionReason, JobKey, null), cancellationToken);
                suspended++;
                logger.LogInformation("Trial expired: account {AccountId} suspended (trial ended {TrialEnd:O}).", accountId, trialEnd.Value);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Trial-expiration failed for account {AccountId}.", accountId);
                await RecordFailureAsync(accountId, idempotencyKey, now, ex, cancellationToken);
            }
        }

        logger.LogInformation(
            "Trial-expiration cycle complete: {Total} trial account(s) checked, {Suspended} suspended.",
            trialAccounts.Count, suspended);
    }

    /// <summary>The earliest trial end across the account's features; an explicit `trialEndsAt` wins over the tier window.</summary>
    public static DateTimeOffset? ResolveTrialEnd(IReadOnlyCollection<TrialFeatureVm> features)
    {
        DateTimeOffset? trialEnd = null;
        foreach (var feature in features)
        {
            var candidate = ParseTrialEnd(feature.ConfigurationJson)
                ?? (string.Equals(feature.Tier, TrialTier, StringComparison.OrdinalIgnoreCase) ? feature.EffectiveTo : null);

            if (candidate.HasValue && (trialEnd is null || candidate.Value < trialEnd.Value))
            {
                trialEnd = candidate;
            }
        }

        return trialEnd;
    }

    private static DateTimeOffset? ParseTrialEnd(string? configurationJson)
    {
        if (string.IsNullOrWhiteSpace(configurationJson))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(configurationJson);
            return document.RootElement.TryGetProperty("trialEndsAt", out var value) && value.TryGetDateTimeOffset(out var trialEnd)
                ? trialEnd
                : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private async Task RecordFailureAsync(
        Guid accountId, string idempotencyKey, DateTimeOffset startedAt, Exception ex, CancellationToken cancellationToken)
    {
        try
        {
            await store.RecordFailureAsync(
                accountId, $"{idempotencyKey}:failed:{startedAt:O}", startedAt, ex.GetType().Name, ex.Message, cancellationToken);
        }
        catch (Exception recordEx) when (recordEx is not OperationCanceledException)
        {
            logger.LogError(recordEx, "Failed to record trial-expiration failure for account {AccountId}.", accountId);
        }
    }
}
