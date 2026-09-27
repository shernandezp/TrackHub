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
using TrackHub.Manager.Application.AlertEvents;
using TrackHub.Manager.Domain.Constants;

namespace TrackHub.Manager.Application.BackgroundJobs;

/// <summary>
/// Detects communication loss (stale transporter positions) for accounts with an enabled
/// CommunicationLoss rule, escalates unacknowledged critical alerts once, and once a day emits GPS
/// credential-expiry alerts. Feature-disabled and suspended accounts are skipped.
/// </summary>
public sealed class AlertEvaluationJob(
    IAccountFeatureGate features,
    IAlertEvaluationStore store,
    IAlertRecorder recorder,
    ILogger<AlertEvaluationJob> logger) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromMinutes(5);
    public static TimeSpan StartupDelay => TimeSpan.FromMinutes(2);

    public const string JobKey = BackgroundJobKeys.AlertEvaluation;
    public const int DefaultCommunicationLossThresholdMinutes = 60;
    public const int CredentialExpiryWithinDays = 7;

    public async Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var enabledAccounts = await features.EnabledActiveAccountsAsync(
            FeatureKeys.Notifications, now, cancellationToken);

        if (enabledAccounts.Count > 0)
        {
            await DetectCommunicationLossAsync(enabledAccounts, now, cancellationToken);
            await EscalateUnacknowledgedCriticalAsync(enabledAccounts, now, cancellationToken);
        }

        await EmitCredentialExpiryDailyAsync(now, cancellationToken);
    }

    // An episode is one silence, identified by the last fix before it: it alerts once however long
    // it lasts, a manual resolve holds, and the next fix both closes it and starts the clock for a
    // fresh one. Several rules on one account contribute their stale sets to the same picture.
    private async Task DetectCommunicationLossAsync(
        IReadOnlyCollection<Guid> accountIds, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var rules = await store.GetEnabledRulesAsync(
            accountIds, [AlertEventTypes.CommunicationLoss], cancellationToken);
        var openAlerts = (await store.GetOpenAlertsAsync(accountIds, AlertEventTypes.CommunicationLoss, cancellationToken))
            .ToLookup(a => a.AccountId);
        var raised = 0;
        var recovered = 0;

        // No enabled rule means nobody wants the alert any more: what is still open is closed.
        foreach (var orphan in openAlerts.Where(g => !rules.Any(r => r.AccountId == g.Key)).SelectMany(g => g))
        {
            recovered += await recorder.ResolveOpenAsync(orphan.AccountId, "Transporter", orphan.ResourceId, [AlertEventTypes.CommunicationLoss], cancellationToken);
        }

        foreach (var accountRules in rules.GroupBy(r => r.AccountId))
        {
            try
            {
                var stale = new Dictionary<Guid, (StaleTransporterVm Transporter, int ThresholdMinutes)>();
                foreach (var rule in accountRules)
                {
                    var thresholdMinutes = NotificationRuleContracts.ParseConfiguration(rule.ConfigurationJson).ThresholdMinutes
                        ?? DefaultCommunicationLossThresholdMinutes;
                    var cutoff = now.AddMinutes(-Math.Max(1, thresholdMinutes));

                    // A transporter that never reported is a provisioning state, not communication loss.
                    foreach (var transporter in await store.GetStaleTransportersAsync(rule.AccountId, cutoff, cancellationToken))
                    {
                        stale.TryAdd(transporter.TransporterId, (transporter, thresholdMinutes));
                    }
                }

                raised += await RaiseCommunicationLossAsync(accountRules.Key, stale, cancellationToken);
                recovered += await RecoverCommunicationLossAsync(accountRules.Key, openAlerts[accountRules.Key], stale.Keys, cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Communication-loss detection failed for account {AccountId}.", accountRules.Key);
            }
        }

        if (raised > 0 || recovered > 0)
        {
            await store.RecordJobRunAsync(
                JobKey, null, raised.ToString(), $"comm-loss:{now:yyyyMMddHHmmssfff}", now, cancellationToken);
            logger.LogInformation("Communication-loss detection raised {Raised} and resolved {Recovered} alert(s).", raised, recovered);
        }
    }

    private async Task<int> RaiseCommunicationLossAsync(
        Guid accountId,
        IReadOnlyDictionary<Guid, (StaleTransporterVm Transporter, int ThresholdMinutes)> stale,
        CancellationToken cancellationToken)
    {
        if (stale.Count == 0)
        {
            return 0;
        }

        var episodes = stale.Values.ToDictionary(s => AlertKeys.CommunicationLoss(s.Transporter.TransporterId, s.Transporter.LastPositionAt));
        var known = (await store.RecordedKeysAsync(accountId, [.. episodes.Keys], cancellationToken)).ToHashSet(StringComparer.Ordinal);
        var raised = 0;

        foreach (var (key, (transporter, thresholdMinutes)) in episodes)
        {
            if (known.Contains(key))
            {
                continue;
            }

            var result = await recorder.RecordAsync(new AlertEventDto(
                accountId,
                AlertEventTypes.CommunicationLoss,
                AlertSeverities.Warning,
                "Notifications",
                "Transporter",
                transporter.TransporterId.ToString(),
                "Open",
                JsonSerializer.Serialize(new
                {
                    transporter.TransporterId,
                    transporter.Name,
                    transporter.LastPositionAt,
                    ThresholdMinutes = thresholdMinutes,
                }),
                key), cancellationToken);

            if (result.Transition == AlertTransition.Opened)
            {
                raised++;
            }
        }

        return raised;
    }

    private async Task<int> RecoverCommunicationLossAsync(
        Guid accountId, IEnumerable<AlertEventVm> openAlerts, IReadOnlyCollection<Guid> stillStale, CancellationToken cancellationToken)
    {
        var recovered = 0;
        foreach (var alert in openAlerts)
        {
            if (Guid.TryParse(alert.ResourceId, out var transporterId) && !stillStale.Contains(transporterId))
            {
                recovered += await recorder.ResolveOpenAsync(accountId, "Transporter", alert.ResourceId, [AlertEventTypes.CommunicationLoss], cancellationToken);
            }
        }

        return recovered;
    }

    // Single-step deterministic escalation: a critical alert unacknowledged past the rule's
    // escalateAfterMinutes gets exactly one role-addressed InApp delivery to administrators.
    private async Task EscalateUnacknowledgedCriticalAsync(
        IReadOnlyCollection<Guid> accountIds, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var criticalOpen = await store.GetOpenCriticalAlertsAsync(accountIds, cancellationToken);
        if (criticalOpen.Count == 0)
        {
            return;
        }

        var eventTypes = criticalOpen.Select(e => e.EventType).Distinct().ToList();
        var rules = await store.GetEnabledRulesAsync(accountIds, eventTypes, cancellationToken);
        var escalated = 0;

        foreach (var alertEvent in criticalOpen)
        {
            try
            {
                var rule = rules.FirstOrDefault(r => r.AccountId == alertEvent.AccountId && r.TriggerEvent == alertEvent.EventType);
                if (rule.NotificationRuleId == Guid.Empty)
                {
                    continue;
                }

                var escalateAfterMinutes = NotificationRuleContracts.ParseConfiguration(rule.ConfigurationJson).EscalateAfterMinutes;
                if (escalateAfterMinutes is null || alertEvent.FirstSeenAt > now.AddMinutes(-escalateAfterMinutes.Value))
                {
                    continue;
                }

                var idempotencyKey = $"escalate:{alertEvent.AlertEventId:N}";
                if (await store.JobRunSucceededAsync(JobKey, idempotencyKey, cancellationToken))
                {
                    continue;
                }

                await store.EscalateToAdministratorsAsync(
                    alertEvent.AccountId, rule.NotificationRuleId, alertEvent.AlertEventId,
                    JobKey, idempotencyKey, now, cancellationToken);
                escalated++;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Escalation failed for alert event {AlertEventId}.", alertEvent.AlertEventId);
            }
        }

        if (escalated > 0)
        {
            logger.LogInformation("Escalated {Count} unacknowledged critical alert(s) to administrators.", escalated);
        }
    }


    // Same keys as EmitExpiringCredentialAlertsCommand, so manual runs coalesce. A credential
    // alerts once per expiry instant; renewing it (a later expiry) resolves the open alert and
    // starts a new episode when that expiry comes within range.
    private async Task EmitCredentialExpiryDailyAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var idempotencyKey = $"credential-scan:{now:yyyyMMdd}";
        if (await store.JobRunSucceededAsync(JobKey, idempotencyKey, cancellationToken))
        {
            return;
        }

        var gpsAccounts = await features.EnabledActiveAccountsAsync(FeatureKeys.GpsIntegration, now, cancellationToken);
        var cutoff = now.AddDays(CredentialExpiryWithinDays);
        var emitted = 0;

        if (gpsAccounts.Count > 0)
        {
            var expiring = await store.GetExpiringCredentialsAsync(gpsAccounts, cutoff, cancellationToken);
            foreach (var credential in expiring)
            {
                try
                {
                    var result = await recorder.RecordAsync(new AlertEventDto(
                        credential.AccountId,
                        AlertEventTypes.GpsCredentialExpiring,
                        AlertSeverities.Warning,
                        "GpsIntegration",
                        "Operator",
                        credential.OperatorId.ToString(),
                        "Open",
                        JsonSerializer.Serialize(new
                        {
                            credential.CredentialId,
                            credential.OperatorId,
                            credential.TokenExpiration,
                            credential.RefreshTokenExpiration,
                            WithinDays = CredentialExpiryWithinDays,
                        }),
                        AlertKeys.GpsCredentialExpiring(credential.OperatorId, credential.EarliestExpirationAt)), cancellationToken);

                    if (result.Transition == AlertTransition.Opened)
                    {
                        emitted++;
                    }
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Credential-expiry alert failed for operator {OperatorId}.", credential.OperatorId);
                }
            }

            // An open alert whose baseline no longer matches the credential (renewed, replaced or gone) is recovered;
            // one raised manually with a wider window keeps its own baseline and stays open.
            var currentKeys = (await store.GetExpiringCredentialsAsync(gpsAccounts, DateTimeOffset.MaxValue, cancellationToken))
                .GroupBy(c => c.OperatorId)
                .ToDictionary(g => g.Key.ToString(), g => AlertKeys.GpsCredentialExpiring(g.Key, g.Min(c => c.EarliestExpirationAt)));
            foreach (var alert in await store.GetOpenAlertsAsync(gpsAccounts, AlertEventTypes.GpsCredentialExpiring, cancellationToken))
            {
                if (!currentKeys.TryGetValue(alert.ResourceId, out var currentKey) || currentKey != alert.DeduplicationKey)
                {
                    await recorder.ResolveOpenAsync(alert.AccountId, "Operator", alert.ResourceId, [AlertEventTypes.GpsCredentialExpiring], cancellationToken);
                }
            }
        }

        await store.RecordJobRunAsync(JobKey, null, emitted.ToString(), idempotencyKey, now, cancellationToken);
        logger.LogInformation("Daily credential-expiry scan emitted {Count} alert(s).", emitted);
    }
}
