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
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using TrackHub.Manager.Application.Notifications.Events;
using TrackHub.Manager.Domain.Constants;

namespace TrackHub.Manager.Application.BackgroundJobs;

/// <summary>
/// Dispatches Pending deliveries through the registered channel providers, retrying with exponential
/// backoff and then failing permanently with the provider error. A Sending in-flight status prevents
/// double-send on overlapping cycles, and a row left in Sending by a crashed cycle is reclaimed.
/// Channel entitlements are re-checked here: deliveries on a disabled billable channel are HELD (left
/// Pending), so disabling a feature stops sends immediately without deleting configuration.
/// </summary>
public sealed class NotificationDispatchJob(
    INotificationDispatchStore store,
    IAccountFeatureGate features,
    INotificationRenderer renderer,
    IEnumerable<INotificationChannelProvider> channelProviders,
    IPublisher publisher,
    IConfiguration configuration,
    ILogger<NotificationDispatchJob> logger) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromSeconds(30);
    public static TimeSpan StartupDelay => TimeSpan.FromMinutes(1);

    public const int MaxAttempts = 5;
    public const int BatchSize = 100;
    public const int DefaultSendingReclaimMinutes = 10;

    /// <summary>How long a delivery waits after attempt N; the last entry covers every further attempt.</summary>
    public static readonly int[] RetryBackoffMinutes = [1, 5, 15, 60];

    public async Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        await ReclaimStrandedAsync(now, cancellationToken);

        var eligible = await store.GetEligiblePendingAsync(
            [.. RetryBackoffMinutes.Select(minutes => now.AddMinutes(-minutes))], BatchSize, cancellationToken);
        if (eligible.Count == 0)
        {
            return;
        }

        var entitlements = await ResolveEntitlementsAsync(eligible, now, cancellationToken);
        var processed = 0;
        var failed = 0;

        foreach (var delivery in eligible)
        {
            if (!entitlements.Allows(delivery.AccountId, delivery.Channel))
            {
                continue; // held: feature disabled, configuration preserved
            }

            var outcome = await ProcessAsync(delivery, cancellationToken);
            if (outcome is null)
            {
                continue; // the outcome could not be recorded; the reclaim will pick the row up
            }

            processed++;
            failed += outcome.Value.RaiseFailureAlert ? 1 : 0;
        }

        if (processed > 0)
        {
            await store.RecordJobRunAsync(processed.ToString(), $"dispatch:{now:yyyyMMddHHmmssfff}", now, cancellationToken);
            logger.LogInformation("Notification dispatch cycle: {Processed} delivery(ies) processed, {Failed} permanently failed.", processed, failed);
        }
    }

    /// <summary>
    /// One delivery, end to end. Persisting the outcome is its own failure domain: a row whose
    /// outcome cannot be written must not abandon the rest of the batch — it stays in
    /// <c>Sending</c> and the next cycle's reclaim puts it back on the ladder. Null means exactly
    /// that, and the caller does not count the delivery as processed.
    /// </summary>
    private async Task<DeliveryOutcome?> ProcessAsync(DispatchDeliveryVm delivery, CancellationToken cancellationToken)
    {
        DeliveryOutcome outcome;
        try
        {
            await store.MarkSendingAsync(delivery.NotificationDeliveryId, cancellationToken);
            var (result, terminal) = await DispatchAsync(delivery, cancellationToken);
            outcome = Outcome(delivery, result, terminal);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Dispatch failed for delivery {DeliveryId} ({Channel}).", delivery.NotificationDeliveryId, delivery.Channel);
            outcome = Outcome(delivery, new NotificationSendResult(false, null, ex.Message), false);
        }

        try
        {
            await store.ApplyOutcomeAsync(outcome, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Recording the dispatch outcome for delivery {DeliveryId} failed.", delivery.NotificationDeliveryId);
            return null;
        }

        await PublishOutcomeAsync(outcome, cancellationToken);
        return outcome;
    }

    /// <summary>
    /// The delivery row is the idempotency record: Sent is terminal, a retryable failure returns it
    /// to Pending for the next rung of the ladder, and the last attempt fails it permanently and
    /// raises the delivery-failure alert.
    /// </summary>
    public static DeliveryOutcome Outcome(DispatchDeliveryVm delivery, NotificationSendResult result, bool terminal)
    {
        if (result.Success)
        {
            return new(delivery.NotificationDeliveryId, delivery.AccountId, delivery.Channel,
                DeliveryStatuses.Sent, delivery.Attempts + 1, result.ProviderMessageId, null, false);
        }

        var attempts = terminal ? MaxAttempts : delivery.Attempts + 1;
        var permanent = attempts >= MaxAttempts;
        return new(delivery.NotificationDeliveryId, delivery.AccountId, delivery.Channel,
            permanent ? DeliveryStatuses.Failed : DeliveryStatuses.Pending, attempts,
            null, result.Error ?? "Unknown provider error.", permanent);
    }

    // Crash recovery. A delivery is flipped to Sending and committed BEFORE the provider call, and no
    // other code path moves it back, so without this the in-flight delivery of every restart is
    // stranded forever. It goes through the ordinary failure path, which counts the attempt, so the
    // backoff ladder applies and MaxAttempts still terminates a delivery that keeps killing the process.
    private async Task ReclaimStrandedAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var reclaimMinutes = Math.Max(1, configuration.GetValue<int?>("AppSettings:NotificationSendingReclaimMinutes") ?? DefaultSendingReclaimMinutes);
        var stranded = await store.GetStrandedSendingAsync(now.AddMinutes(-reclaimMinutes), BatchSize, cancellationToken);
        if (stranded.Count == 0)
        {
            return;
        }

        var error = $"Dispatch was interrupted: the delivery stayed in {DeliveryStatuses.Sending} for more than {reclaimMinutes} minute(s).";
        foreach (var delivery in stranded)
        {
            await store.ApplyOutcomeAsync(
                Outcome(delivery, new NotificationSendResult(false, null, error), false), cancellationToken);
        }

        logger.LogWarning("Reclaimed {Count} delivery(ies) stranded in {Status} for more than {Minutes} minute(s).",
            stranded.Count, DeliveryStatuses.Sending, reclaimMinutes);
    }

    private async Task<DispatchEntitlements> ResolveEntitlementsAsync(
        IReadOnlyCollection<DispatchDeliveryVm> eligible, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var accountIds = eligible.Select(d => d.AccountId).Distinct().ToList();

        async Task<IReadOnlySet<Guid>> EnabledAsync(string featureKey)
            => (await features.EnabledAmongAsync(accountIds, featureKey, now, cancellationToken)).ToHashSet();

        return new DispatchEntitlements(
            await EnabledAsync(FeatureKeys.Notifications),
            await EnabledAsync(FeatureKeys.NotificationsEmail),
            await EnabledAsync(FeatureKeys.NotificationsWhatsApp));
    }

    private async Task<(NotificationSendResult Result, bool Terminal)> DispatchAsync(
        DispatchDeliveryVm delivery, CancellationToken cancellationToken)
    {
        var provider = channelProviders.FirstOrDefault(p => string.Equals(p.Channel, delivery.Channel, StringComparison.Ordinal));
        if (provider is null)
        {
            return (new NotificationSendResult(false, null, $"No delivery provider is registered for channel '{delivery.Channel}'."), true);
        }

        return (await provider.SendAsync(await BuildMessageAsync(delivery, cancellationToken), cancellationToken), false);
    }

    private async Task<NotificationMessage> BuildMessageAsync(DispatchDeliveryVm delivery, CancellationToken cancellationToken)
    {
        var rule = delivery.NotificationRuleId.HasValue
            ? await store.GetRuleAsync(delivery.NotificationRuleId.Value, cancellationToken)
            : null;
        var alertEvent = delivery.AlertEventId.HasValue
            ? await store.GetAlertEventAsync(delivery.AlertEventId.Value, cancellationToken)
            : null;

        // In-app deliveries carry no server-rendered text: the portal localizes them from the event
        // metadata through its own i18n layer.
        if (delivery.Channel == NotificationChannels.InApp)
        {
            return new NotificationMessage(delivery.NotificationDeliveryId, delivery.AccountId, delivery.Recipient,
                null, string.Empty, NotificationLocales.English, null, alertEvent?.PayloadJson);
        }

        var ruleConfiguration = NotificationRuleContracts.ParseConfiguration(rule?.ConfigurationJson);
        var locale = await renderer.ResolveLocaleAsync(
            delivery.RecipientPrincipalType, delivery.Recipient, ruleConfiguration.Locale, cancellationToken);

        // Pre-rendered content (digest summaries) bypasses template resolution.
        var prerendered = ParsePrerendered(delivery.PayloadJson);
        if (prerendered.HasValue)
        {
            return new NotificationMessage(delivery.NotificationDeliveryId, delivery.AccountId, delivery.Recipient,
                prerendered.Value.Subject, prerendered.Value.Body, locale, ruleConfiguration.WebhookSecret, alertEvent?.PayloadJson);
        }

        var portalBaseUrl = configuration.GetValue<string>("AppSettings:PortalBaseUrl") ?? "https://localhost:3000";
        var rendered = await renderer.RenderAsync(
            delivery.AccountId, alertEvent?.EventType ?? NotificationTemplateKeys.Test, delivery.Channel, locale,
            Tokens(alertEvent, portalBaseUrl), cancellationToken);

        return new NotificationMessage(delivery.NotificationDeliveryId, delivery.AccountId, delivery.Recipient,
            rendered.Subject, rendered.Body, locale, ruleConfiguration.WebhookSecret, alertEvent?.PayloadJson);
    }

    private static Dictionary<string, string> Tokens(AlertEventVm? alertEvent, string portalBaseUrl)
        => new()
        {
            ["eventType"] = alertEvent?.EventType ?? "Test",
            ["severity"] = alertEvent?.Severity ?? AlertSeverities.Info,
            ["sourceModule"] = alertEvent?.SourceModule ?? "Notifications",
            ["resourceType"] = alertEvent?.ResourceType ?? string.Empty,
            ["resourceId"] = alertEvent?.ResourceId ?? string.Empty,
            ["occurredAt"] = (alertEvent?.LastSeenAt ?? DateTimeOffset.UtcNow).ToString("O"),
            ["link"] = portalBaseUrl,
        };

    private static (string? Subject, string Body)? ParsePrerendered(string? payloadJson)
    {
        if (string.IsNullOrWhiteSpace(payloadJson))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(payloadJson);
            if (document.RootElement.TryGetProperty("body", out var body) && body.ValueKind == JsonValueKind.String)
            {
                var subject = document.RootElement.TryGetProperty("subject", out var s) && s.ValueKind == JsonValueKind.String ? s.GetString() : null;
                return (subject, body.GetString()!);
            }
        }
        catch (JsonException)
        {
            // fall through to template rendering
        }

        return null;
    }

    // Domain events: a publish failure must never disturb the dispatch loop.
    private async Task PublishOutcomeAsync(DeliveryOutcome outcome, CancellationToken cancellationToken)
    {
        try
        {
            if (outcome.Status == DeliveryStatuses.Sent)
            {
                await publisher.Publish(new NotificationDeliverySucceeded.Notification(
                    outcome.NotificationDeliveryId, outcome.AccountId, outcome.Channel, outcome.ProviderMessageId), cancellationToken);
            }
            else if (outcome.Status == DeliveryStatuses.Failed)
            {
                await publisher.Publish(new NotificationDeliveryFailed.Notification(
                    outcome.NotificationDeliveryId, outcome.AccountId, outcome.Channel, outcome.Attempts, outcome.Error), cancellationToken);
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Failed to publish delivery outcome for {DeliveryId}.", outcome.NotificationDeliveryId);
        }
    }
}

/// <summary>
/// Which accounts may receive on which channel this cycle. The base `notifications` feature gates ALL
/// dispatch for an account; Email and WhatsApp additionally need their own billable key.
/// </summary>
public readonly record struct DispatchEntitlements(
    IReadOnlySet<Guid> Notifications,
    IReadOnlySet<Guid> Email,
    IReadOnlySet<Guid> WhatsApp)
{
    public bool Allows(Guid accountId, string channel)
        => Notifications.Contains(accountId)
            && channel switch
            {
                NotificationChannels.Email => Email.Contains(accountId),
                NotificationChannels.WhatsApp => WhatsApp.Contains(accountId),
                _ => true,
            };
}
