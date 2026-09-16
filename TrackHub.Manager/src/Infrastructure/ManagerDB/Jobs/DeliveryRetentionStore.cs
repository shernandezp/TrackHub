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

public sealed class DeliveryRetentionStore(IApplicationDbContext context) : IDeliveryRetentionStore
{
    public async Task<int> DeleteCompletedDeliveriesAsync(DateTimeOffset cutoff, CancellationToken cancellationToken)
        => await context.NotificationDeliveries
            .Where(d => d.Created < cutoff
                && (d.Status == DeliveryStatuses.Sent || d.Status == DeliveryStatuses.Failed || d.Status == DeliveryStatuses.Digested))
            .ExecuteDeleteAsync(cancellationToken);

    public async Task RecordJobRunAsync(string resourceKey, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        context.BackgroundJobRuns.Add(new BackgroundJobRun(
            BackgroundJobKeys.DeliveryRetention, null, resourceKey, idempotencyKey, "Succeeded", 1, startedAt)
        {
            CompletedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync(cancellationToken);
    }
}
