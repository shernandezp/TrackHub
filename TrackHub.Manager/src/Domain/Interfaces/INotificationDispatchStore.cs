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

public readonly record struct DispatchDeliveryVm(
    Guid NotificationDeliveryId, Guid AccountId, Guid? NotificationRuleId, Guid? AlertEventId,
    string Channel, string RecipientPrincipalType, string Recipient, int Attempts, string? PayloadJson);

/// <summary>What the dispatcher decided about one delivery, applied as a single commit.</summary>
public readonly record struct DeliveryOutcome(
    Guid NotificationDeliveryId, Guid AccountId, string Channel, string Status, int Attempts,
    string? ProviderMessageId, string? Error, bool RaiseFailureAlert);

public interface INotificationDispatchStore
{
    Task<IReadOnlyCollection<DispatchDeliveryVm>> GetStrandedSendingAsync(
        DateTimeOffset cutoff, int batchSize, CancellationToken cancellationToken);

    /// <summary>
    /// Pending deliveries whose backoff has elapsed. <paramref name="attemptCutoffs"/> is the ladder the
    /// caller owns, one cutoff per attempt count 1..n; the last entry covers every further attempt.
    /// </summary>
    Task<IReadOnlyCollection<DispatchDeliveryVm>> GetEligiblePendingAsync(
        IReadOnlyList<DateTimeOffset> attemptCutoffs, int batchSize, CancellationToken cancellationToken);

    Task MarkSendingAsync(Guid notificationDeliveryId, CancellationToken cancellationToken);

    Task<NotificationRuleVm?> GetRuleAsync(Guid notificationRuleId, CancellationToken cancellationToken);

    Task<AlertEventVm?> GetAlertEventAsync(Guid alertEventId, CancellationToken cancellationToken);

    /// <summary>The delivery outcome and its failure alert, written together.</summary>
    Task ApplyOutcomeAsync(DeliveryOutcome outcome, CancellationToken cancellationToken);

    Task RecordJobRunAsync(string resourceKey, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken);
}
