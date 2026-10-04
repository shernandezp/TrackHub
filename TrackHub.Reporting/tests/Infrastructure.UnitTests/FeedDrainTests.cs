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

using TrackHub.Reporting.Domain.Exceptions;
using TrackHub.Reporting.Domain.Paging;

namespace TrackHub.Reporting.Infrastructure.UnitTests;

// Every report feed drains through one loop; each variant reads one page past the limit and raises,
// so an oversized export fails instead of shipping a clean-looking truncated file.
[TestFixture]
public class FeedDrainTests
{
    private static IReadOnlyCollection<int> Page(int start, int size) => Enumerable.Range(start, size).ToList();

    [Test]
    public async Task OffsetDrain_StepsByTheProducerPage_AndStopsAtTheTotal()
    {
        var requests = new List<int>();
        var rows = await FeedDrain.DrainAsync<int>((skip, take) =>
        {
            requests.Add(skip);
            return Task.FromResult<(IReadOnlyCollection<int>?, int)>((Page(skip, Math.Min(take, 1200 - skip)), 1200));
        });

        Assert.Multiple(() =>
        {
            Assert.That(rows, Has.Count.EqualTo(1200));
            Assert.That(requests, Is.EqualTo(new[] { 0, 500, 1000 }));
        });
    }

    [Test]
    public async Task CursorDrain_FollowsTheCursorToTheEnd()
    {
        var cursors = new List<string?>();
        var rows = await FeedDrain.DrainByCursorAsync<int>(cursor =>
        {
            cursors.Add(cursor);
            var index = cursor is null ? 0 : int.Parse(cursor);
            return Task.FromResult<(IReadOnlyCollection<int>?, bool, string?)>((Page(index * 100, 100), index < 2, (index + 1).ToString()));
        });

        Assert.Multiple(() =>
        {
            Assert.That(rows, Has.Count.EqualTo(300));
            Assert.That(cursors, Is.EqualTo(new[] { null, "1", "2" }));
        });
    }

    [Test]
    public async Task EveryVariant_RaisesPastTheLimit_InsteadOfTruncating()
    {
        await Assert.MultipleAsync(async () =>
        {
            await Assert.ThrowsAsync<ReportLimitExceededException>(() => FeedDrain.DrainAsync<int>((skip, take) =>
                Task.FromResult<(IReadOnlyCollection<int>?, int)>((Page(skip, take), FeedDrain.MaxRows + FeedDrain.PageSize))));
            await Assert.ThrowsAsync<ReportLimitExceededException>(() => FeedDrain.DrainByNextSkipAsync<int>((skip, take) =>
                Task.FromResult<(IReadOnlyCollection<int>?, bool, int)>((Page(skip, take), true, skip + take))));
            await Assert.ThrowsAsync<ReportLimitExceededException>(() => FeedDrain.DrainByCursorAsync<int>(cursor =>
                Task.FromResult<(IReadOnlyCollection<int>?, bool, string?)>((Page(0, FeedDrain.PageSize), true, Guid.NewGuid().ToString()))));
        });
    }

    [Test]
    public async Task ExactlyTheLimit_IsStillAValidExport()
    {
        var rows = await FeedDrain.DrainAsync<int>((skip, take) =>
            Task.FromResult<(IReadOnlyCollection<int>?, int)>((Page(skip, take), FeedDrain.MaxRows)));

        Assert.That(rows, Has.Count.EqualTo(FeedDrain.MaxRows));
    }

    [Test]
    public async Task Preview_ReadsOnePageOfThePreviewableFeed_AndKeepsTheProducerTotal()
    {
        var (rows, requests, window) = await Task.Run(async () =>
        {
            var window = FeedDrain.BeginPreview(100);
            var requests = new List<(int Skip, int Take)>();
            var rows = await FeedDrain.DrainAsync<int>((skip, take) =>
            {
                requests.Add((skip, take));
                return Task.FromResult<(IReadOnlyCollection<int>?, int)>((Page(skip, take), 5000));
            }, previewable: true);
            return (rows, requests, window);
        });

        Assert.Multiple(() =>
        {
            Assert.That(rows, Has.Count.EqualTo(100));
            Assert.That(requests, Is.EqualTo(new[] { (0, 100) }));
            Assert.That(window.TotalCount, Is.EqualTo(5000));
        });
    }

    [Test]
    public async Task Preview_LeavesLookupDrainsWhole()
    {
        var rows = await Task.Run(async () =>
        {
            FeedDrain.BeginPreview(100);
            return await FeedDrain.DrainAsync<int>((skip, take) =>
                Task.FromResult<(IReadOnlyCollection<int>?, int)>((Page(skip, Math.Min(take, 700 - skip)), 700)));
        });

        Assert.That(rows, Has.Count.EqualTo(700));
    }
}
