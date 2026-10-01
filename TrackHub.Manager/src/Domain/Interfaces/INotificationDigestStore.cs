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

/// <summary>The fold unit: one summary per rule, recipient and channel.</summary>
public readonly record struct DigestGroupKey(Guid NotificationRuleId, string RecipientPrincipalType, string Recipient, string Channel);

public readonly record struct DeferredDeliveryVm(
    Guid NotificationDeliveryId, Guid AccountId, Guid NotificationRuleId, Guid? AlertEventId,
    string Channel, string RecipientPrincipalType, string Recipient);

public interface INotificationDigestStore
{
    Task<IReadOnlyCollection<Guid>> GetAccountsWithDeferredAsync(CancellationToken cancellationToken);

    /// <summary>Marks Expired the account's deferred deliveries whose account is gone or whose rule is gone or disabled.</summary>
    Task<int> ExpireOrphansAsync(Guid accountId, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<DeferredDeliveryVm>> GetDeferredAsync(Guid accountId, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<NotificationRuleVm>> GetRulesAsync(
        IReadOnlyCollection<Guid> ruleIds, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<string>> GetEventTypesAsync(
        IReadOnlyCollection<Guid> alertEventIds, CancellationToken cancellationToken);

    Task<bool> SummaryExistsSinceAsync(DigestGroupKey key, DateTimeOffset since, CancellationToken cancellationToken);

    /// <summary>The summary delivery and the Digested transition of the rows it replaces, in one commit.</summary>
    Task FoldAsync(
        Guid accountId, DigestGroupKey key, string payloadJson,
        IReadOnlyCollection<Guid> foldedDeliveryIds, CancellationToken cancellationToken);

    Task RecordJobRunAsync(string resourceKey, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken);
}
