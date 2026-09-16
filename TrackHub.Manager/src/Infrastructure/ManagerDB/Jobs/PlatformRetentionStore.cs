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
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Jobs;

public sealed class PlatformRetentionStore(IApplicationDbContext context) : IPlatformRetentionStore
{
    public async Task<int> DeleteAgedJobRunsAsync(
        DateTimeOffset cutoff, IReadOnlyCollection<string> durableMarkerJobKeys, CancellationToken cancellationToken)
    {
        // The most recent row per JobKey is the /status page's whole data source (SVD-10/SVD-11): it is
        // preserved no matter how old it is, because for the on-work-only producers an old row IS the
        // healthy steady state and deleting it would blank the job out of the administrator's view.
        //
        // Two round trips rather than a GroupBy for the same reason BackgroundJobStatusReader gives: the
        // grouped form is not reliably translated by EF Core and the InMemory provider hides that.
        var jobKeys = await context.BackgroundJobRuns
            .Select(x => x.JobKey)
            .Distinct()
            .ToListAsync(cancellationToken);

        var latestIds = new List<Guid>(jobKeys.Count);
        foreach (var jobKey in jobKeys)
        {
            var latestId = await context.BackgroundJobRuns
                .Where(x => x.JobKey == jobKey)
                .OrderByDescending(x => x.StartedAt).ThenByDescending(x => x.BackgroundJobRunId)
                .Select(x => x.BackgroundJobRunId)
                .FirstOrDefaultAsync(cancellationToken);

            if (latestId != Guid.Empty)
            {
                latestIds.Add(latestId);
            }
        }

        // A plain array: EF Core cannot translate IReadOnlySet<string>.Contains inside ExecuteDelete.
        var markers = durableMarkerJobKeys.ToArray();

        // Failed rows are left alone: they are the diagnostic trail for a job that stopped working.
        return await context.BackgroundJobRuns
            .Where(x => x.Status == "Succeeded"
                && x.StartedAt < cutoff
                && !markers.Contains(x.JobKey)
                && !latestIds.Contains(x.BackgroundJobRunId))
            .ExecuteDeleteAsync(cancellationToken);
    }

    // Resolved only — an Open or Acknowledged event is still live work no matter its age. Events a
    // delivery row still points at are held back: AlertEventId is a plain column with no foreign key,
    // so nothing else would stop the notification feed from resolving to a row that no longer exists.
    public async Task<int> DeleteAgedResolvedAlertEventsAsync(DateTimeOffset cutoff, CancellationToken cancellationToken)
        => await context.AlertEvents
            .Where(x => x.Status == "Resolved"
                && x.LastSeenAt < cutoff
                && !context.NotificationDeliveries.Any(d => d.AlertEventId == x.AlertEventId))
            .ExecuteDeleteAsync(cancellationToken);

    public async Task RecordJobRunAsync(string resourceKey, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        context.BackgroundJobRuns.Add(new BackgroundJobRun(
            BackgroundJobKeys.PlatformRetention, null, resourceKey, idempotencyKey, "Succeeded", 1, startedAt)
        {
            CompletedAt = DateTimeOffset.UtcNow,
        });
        await context.SaveChangesAsync(cancellationToken);
    }
}
