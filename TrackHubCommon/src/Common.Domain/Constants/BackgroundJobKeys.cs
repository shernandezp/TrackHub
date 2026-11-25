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

namespace Common.Domain.Constants;

/// <summary>
/// The canonical <c>BackgroundJobRun.JobKey</c> catalog, shared because Geofencing also records runs
/// through Manager. Consumers may flag staleness only for keys in <see cref="RecordsEveryCycle"/>; for any
/// other key an absent or old row is the healthy state and must be presented neutrally.
/// </summary>
public static partial class BackgroundJobKeys
{
    public const string AlertEvaluation = "alert-evaluation";
    public const string NotificationDispatch = "notification-dispatch";
    public const string NotificationDigest = "notification-digest";
    public const string DocumentScan = "document-scan";
    public const string DocumentExpiration = "document-expiration";
    public const string DocumentRetentionCleanup = "document-retention-cleanup";
    public const string TrialExpiration = "trial-expiration";
    public const string GeofenceDwellEvaluation = "geofence-dwell-evaluation";
    public const string WorkforceExpirationScan = "workforce-expiration-scan";
    public const string TripEtaRefresh = "trip-eta-refresh";
    public const string TripScheduleReminder = "trip-schedule-reminder";

    /// <summary>
    /// Router SyncWorker liveness. The worker has no HTTP surface, so a missing recent row is the only
    /// evidence that it died; hence it is in <see cref="RecordsEveryCycle"/>.
    /// </summary>
    public const string RouterSyncWorkerHeartbeat = "router-sync-worker";

    /// <summary>
    /// Keys whose producer writes a row on a guaranteed schedule. <c>alert-evaluation</c> records once per
    /// day, so its staleness threshold is measured in days, never minutes.
    /// </summary>
    public static readonly IReadOnlySet<string> RecordsEveryCycle = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        AlertEvaluation,
        RouterSyncWorkerHeartbeat,
    };

    /// <summary>Hours after which a <see cref="RecordsEveryCycle"/> job counts as stale.</summary>
    public const int StalenessThresholdHours = 26;

    public static bool IsCycleRecorded(string jobKey) => RecordsEveryCycle.Contains(jobKey);
}
