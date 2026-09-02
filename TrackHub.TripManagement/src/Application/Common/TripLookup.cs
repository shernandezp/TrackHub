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

namespace TrackHub.TripManagement.Application.Common;

/// <summary>
/// Uniqueness probes for <c>Code</c> and <c>ExternalReference</c>, both unique per account.
/// <para>
/// NOTE (Domain contract gap): <see cref="ITripReader"/> exposes no by-code / by-external-reference
/// lookup, so these probe the paged board with the value as the free-text <c>search</c> term and
/// then compare exactly. A dedicated reader method would be cheaper and exact; this is the closest
/// the frozen contract allows and it never returns a false positive because the comparison is on
/// the projected value, not on the search.
/// </para>
/// </summary>
public static class TripLookup
{
    private const int ProbePageSize = 200;

    // The search is a substring match, so a short value can sit behind hundreds of longer ones
    // ("TRIP-1" behind TRIP-10 ... TRIP-199). One page was not enough to be sure the exact match
    // is absent; the probe walks the matches until a short page ends them.
    private const int MaxProbePages = 25;

    public static Task<TripVm?> FindByCodeAsync(ITripReader reader, Guid accountId, string code, CancellationToken cancellationToken)
        => ProbeAsync(reader, accountId, code, trip => trip.Code, cancellationToken);

    public static Task<TripVm?> FindByExternalReferenceAsync(ITripReader reader, Guid accountId, string externalReference, CancellationToken cancellationToken)
        => ProbeAsync(reader, accountId, externalReference, trip => trip.ExternalReference, cancellationToken);

    private static async Task<TripVm?> ProbeAsync(
        ITripReader reader, Guid accountId, string value, Func<TripVm, string?> projected, CancellationToken cancellationToken)
    {
        for (var page = 0; page < MaxProbePages; page++)
        {
            var result = await reader.GetTripsPageAsync(
                accountId, null, null, null, null, null, null, null, value, page * ProbePageSize, ProbePageSize, cancellationToken);
            foreach (var trip in result.Items)
            {
                if (string.Equals(projected(trip), value, StringComparison.OrdinalIgnoreCase))
                    return trip;
            }

            if (result.Items.Count < ProbePageSize)
                break;
        }

        return null;
    }
}
