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
using Common.Domain.Constants;
using TrackHub.Manager.Domain.Constants;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Jobs;

public sealed class NotificationDigestStore(IApplicationDbContext context) : INotificationDigestStore
{
    private const string JobKey = BackgroundJobKeys.NotificationDigest;

    public async Task<IReadOnlyCollection<DeferredDeliveryVm>> GetDeferredAsync(CancellationToken cancellationToken)
        => await context.NotificationDeliveries
            .Where(d => d.Status == DeliveryStatuses.Deferred && d.NotificationRuleId != null)
            .Select(d => new DeferredDeliveryVm(
                d.NotificationDeliveryId, d.AccountId, d.NotificationRuleId!.Value, d.AlertEventId,
                d.Channel, d.RecipientPrincipalType, d.Recipient))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<NotificationRuleVm>> GetRulesAsync(
        IReadOnlyCollection<Guid> ruleIds, CancellationToken cancellationToken)
        => await context.NotificationRules
            .Where(r => ruleIds.Contains(r.NotificationRuleId))
            .Select(r => new NotificationRuleVm(
                r.NotificationRuleId, r.AccountId, r.RuleKey, r.RuleType, r.Enabled, r.TriggerEvent,
                r.RecipientSelector, r.ChannelsJson, r.ThrottlingJson, r.ConfigurationJson, r.LastModified))
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyCollection<string>> GetEventTypesAsync(
        IReadOnlyCollection<Guid> alertEventIds, CancellationToken cancellationToken)
        => await context.AlertEvents
            .Where(e => alertEventIds.Contains(e.AlertEventId))
            .Select(e => e.EventType)
            .Distinct()
            .ToListAsync(cancellationToken);

    // A summary is the delivery with no alert event and pre-rendered content.
    public async Task<bool> SummaryExistsSinceAsync(DigestGroupKey key, DateTimeOffset since, CancellationToken cancellationToken)
        => await context.NotificationDeliveries.AnyAsync(d =>
            d.NotificationRuleId == key.NotificationRuleId
            && d.AlertEventId == null
            && d.PayloadJson != null
            && d.RecipientPrincipalType == key.RecipientPrincipalType
            && d.Recipient == key.Recipient
            && d.Channel == key.Channel
            && d.Created >= since, cancellationToken);

    public async Task FoldAsync(
        Guid accountId, DigestGroupKey key, string payloadJson,
        IReadOnlyCollection<Guid> foldedDeliveryIds, CancellationToken cancellationToken)
    {
        context.ChangeTracker.Clear();

        context.NotificationDeliveries.Add(new NotificationDelivery(
            accountId, key.NotificationRuleId, null, key.Channel,
            key.RecipientPrincipalType, key.Recipient, DeliveryStatuses.Pending)
        {
            PayloadJson = payloadJson,
        });

        var folded = await context.NotificationDeliveries
            .Where(d => foldedDeliveryIds.Contains(d.NotificationDeliveryId))
            .ToListAsync(cancellationToken);
        foreach (var delivery in folded)
        {
            context.NotificationDeliveries.Attach(delivery);
            delivery.Status = DeliveryStatuses.Digested;
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RecordJobRunAsync(string resourceKey, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        context.BackgroundJobRuns.Add(new BackgroundJobRun(
            JobKey, null, resourceKey, idempotencyKey, "Succeeded", 1, startedAt)
        {
            CompletedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync(cancellationToken);
    }
}
