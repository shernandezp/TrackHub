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

using Common.Application.Paging;
using Common.Domain.Helpers;
using TrackHub.Telemetry.Infrastructure.TelemetryDB.Entities;
using TrackHub.Telemetry.Infrastructure.TelemetryDB.Readers;

namespace TrackHub.Telemetry.Application.UnitTests;

/// <summary>
/// Cursor paging over stored history. The case that matters is a TIE: a fleet syncing on one cadence
/// stamps hundreds of fixes on the same instant, and a cursor that is not a strict tuple comparison
/// either repeats that whole instant on the next page or steps over it.
/// </summary>
[TestFixture]
public class PositionHistoryKeysetPagingTests
{
    private static readonly DateTimeOffset Instant = new(2026, 9, 17, 10, 0, 0, TimeSpan.Zero);

    private static Filters ForAccount(Guid accountId)
        => new(new Dictionary<string, object> { ["AccountId"] = accountId });

    private static TransporterPositionHistory Fix(Guid accountId, DateTimeOffset at, string key)
        => new(accountId, Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), at, at, 1, 2, null, 0, null, null, null, null, null, null, null, key);

    [TestCase(true)]
    [TestCase(false)]
    public async Task EveryFixIsSeenExactlyOnceAcrossPages(bool tied)
    {
        var accountId = Guid.NewGuid();
        await using var context = TestDb.NewContext();

        for (var i = 0; i < 10; i++)
        {
            context.TransporterPositionHistory.Add(Fix(accountId, tied ? Instant : Instant.AddMinutes(-i), $"K{i}"));
        }

        context.SaveChanges();
        var reader = new TransporterPositionHistoryReader(context, TestDb.PrincipalFor(accountId));

        var seen = new List<Guid>();
        string? cursor = null;

        for (var page = 0; page < 10; page++)
        {
            var result = await reader.GetAsync(ForAccount(accountId), 3, null, null, cursor, CancellationToken.None);
            seen.AddRange(result.Items.Select(x => x.TransporterPositionHistoryId));

            if (!result.HasMore)
            {
                break;
            }

            cursor = result.NextCursor;
            Assert.That(cursor, Is.Not.Null, "a page that reports more rows must hand back a cursor");
        }

        using (Assert.EnterMultipleScope())
        {
            Assert.That(seen, Has.Count.EqualTo(10), "every fix exactly once");
            Assert.That(seen.Distinct().Count(), Is.EqualTo(10), "no fix returned twice");
        }
    }

    [Test]
    public async Task TheWindowStillBoundsACursorPage()
    {
        var accountId = Guid.NewGuid();
        await using var context = TestDb.NewContext();

        for (var i = 0; i < 6; i++)
        {
            context.TransporterPositionHistory.Add(Fix(accountId, Instant.AddHours(-i), $"K{i}"));
        }

        context.SaveChanges();
        var reader = new TransporterPositionHistoryReader(context, TestDb.PrincipalFor(accountId));

        var first = await reader.GetAsync(ForAccount(accountId), 2, Instant.AddHours(-3), Instant, null, CancellationToken.None);
        var second = await reader.GetAsync(ForAccount(accountId), 2, Instant.AddHours(-3), Instant, first.NextCursor, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(first.Items, Has.Count.EqualTo(2));
            Assert.That(second.Items, Has.Count.EqualTo(2), "four fixes fall inside the window");
            Assert.That(second.HasMore, Is.False, "the window, not the feed, is what ends the paging");
        }
    }

    [Test]
    public async Task AnExactlyFullFinalPageOffersNoMore()
    {
        var accountId = Guid.NewGuid();
        await using var context = TestDb.NewContext();
        context.TransporterPositionHistory.Add(Fix(accountId, Instant, "K0"));
        context.TransporterPositionHistory.Add(Fix(accountId, Instant.AddMinutes(-1), "K1"));
        context.SaveChanges();

        var reader = new TransporterPositionHistoryReader(context, TestDb.PrincipalFor(accountId));
        var page = await reader.GetAsync(ForAccount(accountId), 2, null, null, null, CancellationToken.None);

        using (Assert.EnterMultipleScope())
        {
            Assert.That(page.Items, Has.Count.EqualTo(2));
            Assert.That(page.HasMore, Is.False);
        }
    }

    [Test]
    public async Task AGarbledCursorReadsAsTheStartOfTheFeed()
    {
        var accountId = Guid.NewGuid();
        await using var context = TestDb.NewContext();
        context.TransporterPositionHistory.Add(Fix(accountId, Instant, "K0"));
        context.SaveChanges();

        var reader = new TransporterPositionHistoryReader(context, TestDb.PrincipalFor(accountId));
        var page = await reader.GetAsync(ForAccount(accountId), 50, null, null, "not-a-cursor", CancellationToken.None);

        Assert.That(page.Items, Has.Count.EqualTo(1));
    }

    [Test]
    public async Task TheCursorCarriesTheLastRowOfThePage()
    {
        var accountId = Guid.NewGuid();
        await using var context = TestDb.NewContext();

        for (var i = 0; i < 4; i++)
        {
            context.TransporterPositionHistory.Add(Fix(accountId, Instant.AddMinutes(-i), $"K{i}"));
        }

        context.SaveChanges();
        var reader = new TransporterPositionHistoryReader(context, TestDb.PrincipalFor(accountId));

        var page = await reader.GetAsync(ForAccount(accountId), 2, null, null, null, CancellationToken.None);

        Assert.That(FeedCursor.TryDecode(page.NextCursor, out var at, out var id), Is.True);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(id, Is.EqualTo(page.Items.Last().TransporterPositionHistoryId));
            Assert.That(at, Is.EqualTo(page.Items.Last().SourceTimestamp));
        }
    }
}
