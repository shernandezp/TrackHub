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
/// Each is one indexed single-row read. They used to walk up to 25 pages of the board with the
/// value as a free-text <c>search</c> term, which made a 200-trip partner batch issue tens of
/// thousands of un-indexed <c>ILIKE '%…%'</c> scans against the shared database.
/// </para>
/// </summary>
public static class TripLookup
{
    public static Task<TripVm?> FindByCodeAsync(ITripReader reader, Guid accountId, string code, CancellationToken cancellationToken)
        => reader.FindByCodeAsync(accountId, code, cancellationToken);

    public static Task<TripVm?> FindByExternalReferenceAsync(ITripReader reader, Guid accountId, string externalReference, CancellationToken cancellationToken)
        => reader.FindByExternalReferenceAsync(accountId, externalReference, cancellationToken);
}
