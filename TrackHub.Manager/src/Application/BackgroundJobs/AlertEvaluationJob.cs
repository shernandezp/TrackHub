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
/// Detects communication loss (stale transporter positions) for accounts with an enabled
/// CommunicationLoss rule, escalates unacknowledged critical alerts once, and once a day emits GPS
/// credential-expiry alerts. Feature-disabled and suspended accounts are skipped.
/// </summary>
public sealed class AlertEvaluationJob(
    IAccountFeatureGate features,
    IAlertEvaluationStore store,
    IAlertRuleEvaluator evaluator,
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

    private async Task DetectCommunicationLossAsync(
        IReadOnlyCollection<Guid> accountIds, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var rules = await store.GetEnabledRulesAsync(
            accountIds, [AlertEventTypes.CommunicationLoss], cancellationToken);
        var raised = 0;

        foreach (var rule in rules)
        {
            try
            {
                var thresholdMinutes = NotificationRuleContracts.ParseConfiguration(rule.ConfigurationJson).ThresholdMinutes
                    ?? DefaultCommunicationLossThresholdMinutes;
                var cutoff = now.AddMinutes(-Math.Max(1, thresholdMinutes));

                // A transporter that never reported is a provisioning state, not communication loss.
                var stale = await store.GetStaleTransportersAsync(rule.AccountId, cutoff, cancellationToken);

                foreach (var transporter in stale)
                {
                    var alertEvent = await store.RecordDedupedAlertAsync(new AlertEventDto(
                        rule.AccountId,
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
                        $"comm-loss:{transporter.TransporterId:N}:{now:yyyyMMdd}"), cancellationToken);

                    if (alertEvent is not null)
                    {
                        await evaluator.EvaluateAsync(alertEvent.Value, cancellationToken);
                        raised++;
                    }
                }
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
            catch (Exception ex)
            {
                logger.LogError(ex, "Communication-loss detection failed for rule {RuleKey} (account {AccountId}).", rule.RuleKey, rule.AccountId);
            }
        }

        if (raised > 0)
        {
            await store.RecordJobRunAsync(
                JobKey, null, raised.ToString(), $"comm-loss:{now:yyyyMMddHHmmssfff}", now, cancellationToken);
            logger.LogInformation("Communication-loss detection raised {Count} alert(s).", raised);
        }
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

    // Mirrors EmitExpiringCredentialAlertsCommand (same dedup keys, so manual runs coalesce) for
    // accounts with gps.integration enabled.
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
            foreach (var credential in await store.GetExpiringCredentialsAsync(gpsAccounts, cutoff, cancellationToken))
            {
                try
                {
                    var alertEvent = await store.RecordDedupedAlertAsync(new AlertEventDto(
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
                        $"gps-credential-expiring:{credential.OperatorId:N}:{now:yyyyMMdd}"), cancellationToken);

                    if (alertEvent is not null)
                    {
                        await evaluator.EvaluateAsync(alertEvent.Value, cancellationToken);
                        emitted++;
                    }
                }
                catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Credential-expiry alert failed for operator {OperatorId}.", credential.OperatorId);
                }
            }
        }

        await store.RecordJobRunAsync(JobKey, null, emitted.ToString(), idempotencyKey, now, cancellationToken);
        logger.LogInformation("Daily credential-expiry scan emitted {Count} alert(s).", emitted);
    }
}
