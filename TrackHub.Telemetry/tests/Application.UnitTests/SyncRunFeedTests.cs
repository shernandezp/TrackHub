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

using TrackHub.Telemetry.Domain.Enums;
using TrackHub.Telemetry.Infrastructure.TelemetryDB.Entities;
using TrackHub.Telemetry.Infrastructure.TelemetryDB.Readers;

namespace TrackHub.Telemetry.Application.UnitTests;

// The report drains follow this feed to the end of a window: it takes the window at the source and
// pages by a cursor with a unique tie-break, so runs sharing an instant are neither repeated nor lost.
[TestFixture]
public class SyncRunFeedTests
{
    private static readonly DateTimeOffset Instant = new(2026, 9, 20, 10, 0, 0, TimeSpan.Zero);

    private static OperatorSyncRun Run(Guid accountId, Guid operatorId, DateTimeOffset startedAt)
        => new(accountId, operatorId, (int)SyncTriggerType.Automatic, (int)OperatorSyncResult.Succeeded, startedAt) { CompletedAt = startedAt.AddSeconds(1) };

    [TestCase(true)]
    [TestCase(false)]
    public async Task EveryRunInTheWindow_IsSeenExactlyOnceAcrossPages(bool tied)
    {
        var accountId = Guid.NewGuid();
        var operatorId = Guid.NewGuid();
        await using var context = TestDb.NewContext();
        for (var i = 0; i < 7; i++)
        {
            context.OperatorSyncRuns.Add(Run(accountId, operatorId, tied ? Instant : Instant.AddMinutes(-i)));
        }
        context.OperatorSyncRuns.Add(Run(accountId, operatorId, Instant.AddDays(-2)));
        context.OperatorSyncRuns.Add(Run(Guid.NewGuid(), Guid.NewGuid(), Instant));
        context.SaveChanges();
        var reader = new OperatorSyncRunReader(context, TestDb.PrincipalFor(accountId));

        var seen = new List<Guid>();
        string? cursor = null;
        var pages = 0;
        do
        {
            var page = await reader.GetFeedAsync(accountId, null, Instant.AddDays(-1), Instant, 3, cursor, CancellationToken.None);
            seen.AddRange(page.Items.Select(r => r.OperatorSyncRunId));
            cursor = page.HasMore ? page.NextCursor : null;
            pages++;
        }
        while (cursor is not null && pages < 10);

        Assert.Multiple(() =>
        {
            Assert.That(seen, Has.Count.EqualTo(7), "the window excludes the older run and the other account");
            Assert.That(seen.Distinct().Count(), Is.EqualTo(7), "no run is repeated across a tied page boundary");
            Assert.That(pages, Is.EqualTo(3));
        });
    }
}
