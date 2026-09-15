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

namespace TrackHub.Manager.Domain.Interfaces;

/// <summary>A transporter whose last reported position is older than its account's threshold.</summary>
public readonly record struct StaleTransporterVm(Guid TransporterId, string Name, DateTimeOffset LastPositionAt);

/// <summary>
/// Everything the alert-evaluation job reads and writes. One port per job keeps the job itself in
/// the Application layer, where its thresholds and escalation policy can be unit-tested.
/// </summary>
public interface IAlertEvaluationStore
{
    Task<IReadOnlyCollection<Guid>> GetFeatureEnabledActiveAccountsAsync(
        string featureKey, DateTimeOffset now, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<NotificationRuleVm>> GetEnabledRulesAsync(
        IReadOnlyCollection<Guid> accountIds, IReadOnlyCollection<string> triggerEvents, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<StaleTransporterVm>> GetStaleTransportersAsync(
        Guid accountId, DateTimeOffset cutoff, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<AlertEventVm>> GetOpenCriticalAlertsAsync(
        IReadOnlyCollection<Guid> accountIds, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<ExpiringCredentialVm>> GetExpiringCredentialsAsync(
        IReadOnlyCollection<Guid> accountIds, DateTimeOffset cutoff, CancellationToken cancellationToken);

    Task<bool> JobRunSucceededAsync(string jobKey, string idempotencyKey, CancellationToken cancellationToken);

    /// <summary>Dedup rule: (AccountId, DeduplicationKey, Status != Resolved) coalesces into the open event; null when it only touched one.</summary>
    Task<AlertEventVm?> RecordDedupedAlertAsync(AlertEventDto alertEvent, CancellationToken cancellationToken);

    Task RecordJobRunAsync(
        string jobKey, Guid? accountId, string? resourceKey, string idempotencyKey,
        DateTimeOffset startedAt, CancellationToken cancellationToken);

    /// <summary>The escalation delivery and its job run, written together so a replay cannot double-send.</summary>
    Task EscalateToAdministratorsAsync(
        Guid accountId, Guid notificationRuleId, Guid alertEventId,
        string jobKey, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken);
}
