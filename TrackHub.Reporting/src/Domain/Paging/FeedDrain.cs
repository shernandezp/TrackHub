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

namespace TrackHub.Reporting.Domain.Paging;

/// <summary>
/// The one drain behind every report feed. Offset feeds step by the PRODUCER's page in its own units
/// and end once they pass the producer's total, cursor and next-skip feeds follow the producer's
/// cursor; all three keep reading one page past the report limit and then raise, so an oversized
/// export fails loudly instead of truncating.
/// </summary>
public static class FeedDrain
{
    public const int PageSize = 500;
    public const int MaxRows = 100_000;

    public static async Task<IReadOnlyCollection<T>> DrainAsync<T>(
        Func<int, int, Task<(IReadOnlyCollection<T>? Items, int TotalCount)>> fetch)
    {
        var all = new List<T>();
        for (var skip = 0; all.Count <= MaxRows; skip += PageSize)
        {
            var (items, totalCount) = await fetch(skip, PageSize);
            all.AddRange(items ?? []);

            if (skip + PageSize >= totalCount)
            {
                break;
            }
        }

        return WithinLimit(all);
    }

    public static async Task<IReadOnlyCollection<T>> DrainByNextSkipAsync<T>(
        Func<int, int, Task<(IReadOnlyCollection<T>? Items, bool HasMore, int NextSkip)>> fetch)
    {
        var all = new List<T>();
        var skip = 0;
        while (all.Count <= MaxRows)
        {
            var (items, hasMore, nextSkip) = await fetch(skip, PageSize);
            all.AddRange(items ?? []);

            // A producer that reports more without advancing is a producer bug; stopping beats hanging.
            if (!hasMore || nextSkip <= skip)
            {
                break;
            }

            skip = nextSkip;
        }

        return WithinLimit(all);
    }

    public static async Task<IReadOnlyCollection<T>> DrainByCursorAsync<T>(
        Func<string?, Task<(IReadOnlyCollection<T>? Items, bool HasMore, string? NextCursor)>> fetch)
    {
        var all = new List<T>();
        string? cursor = null;
        while (all.Count <= MaxRows)
        {
            var (items, hasMore, nextCursor) = await fetch(cursor);
            all.AddRange(items ?? []);

            if (!hasMore || string.IsNullOrEmpty(nextCursor) || nextCursor == cursor)
            {
                break;
            }

            cursor = nextCursor;
        }

        return WithinLimit(all);
    }

    private static IReadOnlyCollection<T> WithinLimit<T>(List<T> rows)
        => rows.Count > MaxRows ? throw new ReportLimitExceededException(MaxRows) : rows;
}
