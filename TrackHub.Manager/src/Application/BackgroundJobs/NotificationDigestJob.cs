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

using Common.Domain.Time;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TrackHub.Manager.Domain.Constants;

namespace TrackHub.Manager.Application.BackgroundJobs;

/// <summary>
/// Folds Deferred deliveries into one pre-rendered summary per (rule, recipient, channel) and marks
/// the originals Digested, one account at a time. Daily rules fold once per account-local day, from
/// the digest hour on; deferrals whose account is gone or whose rule is gone or disabled are expired.
/// </summary>
public sealed class NotificationDigestJob(
    INotificationDigestStore store,
    IAccountFeatureGate features,
    INotificationRenderer renderer,
    IAccountTimeZoneResolver zones,
    IConfiguration configuration,
    ILogger<NotificationDigestJob> logger) : IScheduledJob
{
    public const int DailyDigestLocalHour = 7;

    public static TimeSpan Interval => TimeSpan.FromHours(1);
    public static TimeSpan StartupDelay => TimeSpan.FromMinutes(5);

    public async Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var accounts = await store.GetAccountsWithDeferredAsync(cancellationToken);
        if (accounts.Count == 0)
        {
            return;
        }

        // Disabling `notifications` stops dispatch for the account — folding a digest is dispatch
        // preparation, so those groups are held until the feature is re-enabled.
        var enabledAccounts = await features.EnabledAmongAsync(accounts, FeatureKeys.Notifications, now, cancellationToken);
        var portalBaseUrl = configuration.GetValue<string>("AppSettings:PortalBaseUrl") ?? "https://localhost:3000";
        var summaries = 0;

        foreach (var accountId in accounts)
        {
            try
            {
                var expired = await store.ExpireOrphansAsync(accountId, cancellationToken);
                if (expired > 0)
                {
                    logger.LogWarning("Expired {Count} deferred deliveries of account {AccountId} whose rule is gone or disabled.", expired, accountId);
                }

                if (enabledAccounts.Contains(accountId))
                {
                    summaries += await FoldAccountAsync(accountId, now, portalBaseUrl, cancellationToken);
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Digest cycle failed for account {AccountId}.", accountId);
            }
        }

        if (summaries > 0)
        {
            await store.RecordJobRunAsync(summaries.ToString(), $"digest:{now:yyyyMMddHHmmssfff}", now, cancellationToken);
            logger.LogInformation("Digest cycle folded deferred deliveries into {Count} summary delivery(ies).", summaries);
        }
    }

    private async Task<int> FoldAccountAsync(Guid accountId, DateTimeOffset now, string portalBaseUrl, CancellationToken cancellationToken)
    {
        var deferred = await store.GetDeferredAsync(accountId, cancellationToken);
        if (deferred.Count == 0)
        {
            return 0;
        }

        var rules = (await store.GetRulesAsync([.. deferred.Select(d => d.NotificationRuleId).Distinct()], cancellationToken))
            .ToDictionary(r => r.NotificationRuleId);
        var dailyWindowStart = DailyWindowStart(await zones.ResolveAsync(accountId, cancellationToken), now);
        var summaries = 0;

        foreach (var group in deferred.GroupBy(d => new DigestGroupKey(d.NotificationRuleId, d.RecipientPrincipalType, d.Recipient, d.Channel)))
        {
            if (!rules.TryGetValue(group.Key.NotificationRuleId, out var rule))
            {
                continue;
            }

            if (NotificationRuleContracts.ParseThrottling(rule.ThrottlingJson).Digest == DigestCadences.Daily
                && (dailyWindowStart is not { } since || await store.SummaryExistsSinceAsync(group.Key, since, cancellationToken)))
            {
                continue;
            }

            try
            {
                await FoldAsync(rule, group.Key, [.. group], portalBaseUrl, cancellationToken);
                summaries++;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Digest fold failed for rule {RuleId} recipient {Recipient}.", group.Key.NotificationRuleId, group.Key.Recipient);
            }
        }

        return summaries;
    }

    // Null before the digest hour: a Daily group then waits for the account's morning.
    public static DateTimeOffset? DailyWindowStart(AccountTimeZone zone, DateTimeOffset now)
    {
        var local = zone.DateOf(now).ToDateTime(new TimeOnly(DailyDigestLocalHour, 0));
        if (zone.Zone.IsInvalidTime(local))
        {
            local = local.AddHours(1);
        }

        var start = new DateTimeOffset(TimeZoneInfo.ConvertTimeToUtc(local, zone.Zone), TimeSpan.Zero);
        return now < start ? null : start;
    }

    private async Task FoldAsync(
        NotificationRuleVm rule, DigestGroupKey key, IReadOnlyCollection<DeferredDeliveryVm> group,
        string portalBaseUrl, CancellationToken cancellationToken)
    {
        var eventIds = group.Where(d => d.AlertEventId.HasValue).Select(d => d.AlertEventId!.Value).Distinct().ToList();
        var eventTypes = eventIds.Count > 0
            ? await store.GetEventTypesAsync(eventIds, cancellationToken)
            : [];

        var locale = await renderer.ResolveLocaleAsync(
            key.RecipientPrincipalType, key.Recipient,
            NotificationRuleContracts.ParseConfiguration(rule.ConfigurationJson).Locale, cancellationToken);

        var (subject, body) = await renderer.RenderAsync(
            rule.AccountId, NotificationTemplateKeys.Digest, key.Channel, locale,
            new Dictionary<string, string>
            {
                ["count"] = group.Count.ToString(),
                ["eventTypes"] = string.Join(", ", eventTypes),
                ["link"] = portalBaseUrl,
            },
            cancellationToken);

        await store.FoldAsync(
            rule.AccountId, key, JsonSerializer.Serialize(new { subject, body }),
            [.. group.Select(d => d.NotificationDeliveryId)], cancellationToken);
    }
}
