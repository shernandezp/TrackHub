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

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TrackHub.Manager.Application.BackgroundJobs;

/// <summary>
/// Deletes delivered/failed/digested notification deliveries. Storage hygiene, not a billable
/// surface, so it keeps running for feature-disabled accounts.
/// </summary>
public sealed class DeliveryRetentionJob(
    IDeliveryRetentionStore store,
    IConfiguration configuration,
    ILogger<DeliveryRetentionJob> logger) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromHours(24);
    public static TimeSpan StartupDelay => TimeSpan.FromMinutes(10);

    public const int DefaultRetentionDays = 90;

    public async Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var retentionDays = configuration.GetValue<int?>("AppSettings:NotificationDeliveryRetentionDays") ?? DefaultRetentionDays;
        var deleted = await store.DeleteCompletedDeliveriesAsync(now.AddDays(-Math.Max(1, retentionDays)), cancellationToken);
        if (deleted == 0)
        {
            return;
        }

        await store.RecordJobRunAsync(deleted.ToString(), $"retention:{now:yyyyMMdd}", now, cancellationToken);
        logger.LogInformation(
            "Delivery retention deleted {Count} delivery row(s) older than {Days} day(s).", deleted, retentionDays);
    }
}
