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
/// Purges the two append-only platform tables nothing else ages out: background_job_runs and
/// resolved alert_events. Platform-wide, so it keeps running for feature-disabled and suspended
/// accounts.
/// </summary>
public sealed class PlatformRetentionJob(
    IPlatformRetentionStore store,
    IConfiguration configuration,
    ILogger<PlatformRetentionJob> logger) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromHours(24);
    public static TimeSpan StartupDelay => TimeSpan.FromMinutes(15);

    public const int DefaultJobRunRetentionDays = 90;
    public const int DefaultAlertEventRetentionDays = 180;

    // Job keys whose Succeeded rows are permanent idempotency markers rather than run history:
    // workforce-expiration-scan keys on {qualificationId}:{threshold} and document-expiration on
    // {documentId}:{threshold}, neither of which carries a date. Deleting those rows would re-fire an
    // expiration alert the operator already received.
    public static readonly string[] DurableMarkerJobKeys =
    [
        BackgroundJobKeys.WorkforceExpirationScan,
        BackgroundJobKeys.DocumentExpiration,
    ];

    public async Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
    {
        var jobRunDays = configuration.GetValue<int?>("AppSettings:BackgroundJobRunRetentionDays") ?? DefaultJobRunRetentionDays;
        var alertEventDays = configuration.GetValue<int?>("AppSettings:AlertEventRetentionDays") ?? DefaultAlertEventRetentionDays;

        var jobRunsDeleted = await store.DeleteAgedJobRunsAsync(
            now.AddDays(-Math.Max(1, jobRunDays)), DurableMarkerJobKeys, cancellationToken);
        var alertEventsDeleted = await store.DeleteAgedResolvedAlertEventsAsync(
            now.AddDays(-Math.Max(1, alertEventDays)), cancellationToken);

        if (jobRunsDeleted + alertEventsDeleted == 0)
        {
            return;
        }

        await store.RecordJobRunAsync($"{jobRunsDeleted}/{alertEventsDeleted}", $"retention:{now:yyyyMMdd}", now, cancellationToken);
        logger.LogInformation("Platform retention deleted {JobRuns} job run(s) and {AlertEvents} resolved alert event(s).",
            jobRunsDeleted, alertEventsDeleted);
    }
}
