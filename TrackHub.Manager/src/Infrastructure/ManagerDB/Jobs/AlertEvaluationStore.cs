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

/// <summary>
/// The alert-evaluation job's data access. Host-internal: it runs on no principal, so it carries no
/// account scoping of its own and the job decides which accounts it touches.
/// </summary>
public sealed class AlertEvaluationStore(IApplicationDbContext context) : IAlertEvaluationStore
{
    public async Task<IReadOnlyCollection<NotificationRuleVm>> GetEnabledRulesAsync(
        IReadOnlyCollection<Guid> accountIds, IReadOnlyCollection<string> triggerEvents, CancellationToken cancellationToken)
        => await context.NotificationRules
            .Where(r => accountIds.Contains(r.AccountId) && r.Enabled && triggerEvents.Contains(r.TriggerEvent))
            .Select(r => new NotificationRuleVm(
                r.NotificationRuleId, r.AccountId, r.RuleKey, r.RuleType, r.Enabled, r.TriggerEvent,
                r.RecipientSelector, r.ChannelsJson, r.ThrottlingJson, r.ConfigurationJson, r.LastModified))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<StaleTransporterVm>> GetStaleTransportersAsync(
        Guid accountId, DateTimeOffset cutoff, CancellationToken cancellationToken)
        => await context.TransporterPositions
            .Where(p => p.Transporter.AccountId == accountId && p.DeviceDateTime <= cutoff)
            .Select(p => new StaleTransporterVm(p.TransporterId, p.Transporter.Name, p.DeviceDateTime))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<AlertEventVm>> GetOpenCriticalAlertsAsync(
        IReadOnlyCollection<Guid> accountIds, CancellationToken cancellationToken)
        => await context.AlertEvents
            .Where(e => accountIds.Contains(e.AccountId) && e.Status == "Open" && e.Severity == AlertSeverities.Critical)
            .Select(e => new AlertEventVm(
                e.AlertEventId, e.AccountId, e.EventType, e.Severity, e.SourceModule, e.ResourceType,
                e.ResourceId, e.Status, e.FirstSeenAt, e.LastSeenAt, e.PayloadJson, e.DeduplicationKey, e.LastModified))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<ExpiringCredentialVm>> GetExpiringCredentialsAsync(
        IReadOnlyCollection<Guid> accountIds, DateTimeOffset cutoff, CancellationToken cancellationToken)
        => await context.Credentials
            .Where(c => accountIds.Contains(c.Operator.AccountId)
                && ((c.TokenExpiration.HasValue && c.TokenExpiration <= cutoff)
                    || (c.RefreshTokenExpiration.HasValue && c.RefreshTokenExpiration <= cutoff)))
            .Select(c => new ExpiringCredentialVm(
                c.CredentialId,
                c.OperatorId,
                c.Operator.AccountId,
                c.TokenExpiration,
                c.RefreshTokenExpiration,
                c.TokenExpiration.HasValue && c.RefreshTokenExpiration.HasValue
                    ? (c.TokenExpiration < c.RefreshTokenExpiration ? c.TokenExpiration : c.RefreshTokenExpiration)
                    : (c.TokenExpiration ?? c.RefreshTokenExpiration)))
            .ToListAsync(cancellationToken);

    public async Task<bool> JobRunSucceededAsync(string jobKey, string idempotencyKey, CancellationToken cancellationToken)
        => await context.BackgroundJobRuns.AnyAsync(
            r => r.JobKey == jobKey && r.IdempotencyKey == idempotencyKey && r.Status == "Succeeded", cancellationToken);

    public async Task RecordJobRunAsync(
        string jobKey, Guid? accountId, string? resourceKey, string idempotencyKey,
        DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        context.BackgroundJobRuns.Add(new BackgroundJobRun(
            jobKey, accountId, resourceKey, idempotencyKey, "Succeeded", 1, startedAt)
        {
            CompletedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task EscalateToAdministratorsAsync(
        Guid accountId, Guid notificationRuleId, Guid alertEventId,
        string jobKey, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        context.NotificationDeliveries.Add(new NotificationDelivery(
            accountId, notificationRuleId, alertEventId,
            NotificationChannels.InApp, RecipientPrincipalTypes.Role, Roles.Administrator, DeliveryStatuses.Pending));
        context.BackgroundJobRuns.Add(new BackgroundJobRun(
            jobKey, accountId, alertEventId.ToString(), idempotencyKey, "Succeeded", 1, startedAt)
        {
            CompletedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync(cancellationToken);
    }

    // Mirrors the AlertEventWriter dedup rule: (AccountId, DeduplicationKey, Status != Resolved)
    // coalesces into the existing open event. Returns the Vm to evaluate (null when only touched).
    public async Task<AlertEventVm?> RecordDedupedAlertAsync(AlertEventDto alertEvent, CancellationToken cancellationToken)
    {
        var existing = await context.AlertEvents
            .AsTracking().FirstOrDefaultAsync(
            e => e.AccountId == alertEvent.AccountId
                && e.DeduplicationKey == alertEvent.DeduplicationKey
                && e.Status != "Resolved",
            cancellationToken);

        if (existing is not null)
        {
            existing.LastSeenAt = DateTimeOffset.UtcNow;
            existing.PayloadJson = alertEvent.PayloadJson;
            await context.SaveChangesAsync(cancellationToken);
            return null;
        }

        var entity = new AlertEvent(
            alertEvent.AccountId, alertEvent.EventType, alertEvent.Severity, alertEvent.SourceModule,
            alertEvent.ResourceType, alertEvent.ResourceId, alertEvent.Status, alertEvent.PayloadJson, alertEvent.DeduplicationKey);
        context.AlertEvents.Add(entity);
        await context.SaveChangesAsync(cancellationToken);

        return new AlertEventVm(
            entity.AlertEventId, entity.AccountId, entity.EventType, entity.Severity, entity.SourceModule,
            entity.ResourceType, entity.ResourceId, entity.Status, entity.FirstSeenAt, entity.LastSeenAt,
            entity.PayloadJson, entity.DeduplicationKey, entity.LastModified);
    }
}
