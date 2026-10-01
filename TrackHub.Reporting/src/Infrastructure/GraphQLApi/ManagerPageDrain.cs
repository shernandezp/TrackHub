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

using TrackHub.Reporting.Domain.Paging;

namespace TrackHub.Reporting.Infrastructure.GraphQLApi;

/// <summary>
/// The page envelope Manager returns from every paged read.
/// </summary>
internal sealed class ManagerPage<T>
{
    public List<T> Items { get; set; } = [];
    public int TotalCount { get; set; }
}

/// <summary>
/// Drains a Manager page envelope to completion for report readers.
/// <para>
/// A report that exports fewer rows than exist is worse than a slow one: nothing in the output says
/// it is short. So this never stops at a page boundary on its own — it walks until the source is
/// exhausted, and if the set is larger than a report may carry it RAISES rather than returning what
/// it managed to collect.
/// </para>
/// </summary>
internal static class ManagerPageDrain
{
    public static Task<IReadOnlyCollection<T>> FetchAllAsync<T>(
        Func<int, int, GraphQLRequest> buildRequest,
        Func<GraphQLRequest, CancellationToken, Task<ManagerPage<T>>> send,
        CancellationToken cancellationToken)
        => FeedDrain.DrainAsync<T>(async (skip, take) =>
        {
            var page = await send(buildRequest(skip, take), cancellationToken);
            return (page.Items, page.TotalCount);
        });
}
