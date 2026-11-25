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

namespace TrackHub.TripManagement.Domain.Interfaces;

/// <summary>
/// Read side of the trip aggregate. Every method takes the resolved <c>accountId</c> and, where
/// group scoping applies, the acting <c>userId</c> — visibility is filtered in the query through
/// <c>trip.vw_visible_transporter</c>, never re-implemented per handler.
/// </summary>
public interface ITripReader
{
    /// <summary>
    /// Paged dispatch board. <paramref name="userId"/> is null for principals that see the whole
    /// account (Administrator/Manager roles and account-scoped service clients).
    /// </summary>
    Task<TripsPageVm> GetTripsPageAsync(
        Guid accountId,
        Guid? userId,
        IReadOnlyCollection<string>? statuses,
        DateTimeOffset? from,
        DateTimeOffset? to,
        Guid? transporterId,
        Guid? staffId,
        string? customer,
        string? search,
        string? exception,
        int skip,
        int take,
        CancellationToken cancellationToken);

    Task<TripDetailVm> GetTripDetailAsync(Guid tripId, Guid accountId, Guid? userId, CancellationToken cancellationToken);

    Task<IReadOnlyCollection<TripVm>> GetActiveTripsAsync(Guid accountId, Guid? userId, CancellationToken cancellationToken);

    Task<TripTimelineFeedPageVm> GetTimelineAsync(Guid tripId, Guid accountId, Guid? userId, string? cursor, int take, CancellationToken cancellationToken);

    /// <summary>
    /// The offset read behind the deprecated <c>tripTimeline</c> field. O(offset) plus an exact
    /// count. Goes when the field does.
    /// </summary>
    Task<TripTimelinePageVm> GetTimelineByOffsetAsync(Guid tripId, Guid accountId, Guid? userId, int skip, int take, CancellationToken cancellationToken);

    /// <summary>
    /// Single-trip lookup for the write paths (lifecycle, stops, deliveries, POD) and for route
    /// replay.
    /// <para>
    /// <paramref name="userId"/> is NOT optional and has no default on purpose: without it every write
    /// path would be visibility-blind, letting a dispatcher act on another group's trip. Null means the
    /// principal sees the whole account (Administrator/Manager and account-scoped service clients).
    /// </para>
    /// <para>
    /// A trip the caller cannot see is <c>NotFoundException</c>, never
    /// <c>ForbiddenAccessException</c>: telling a dispatcher "that trip exists but is not yours"
    /// discloses another group's dispatch activity (non-disclosure).
    /// </para>
    /// </summary>
    Task<TripVm> GetTripAsync(Guid tripId, Guid accountId, Guid? userId, CancellationToken cancellationToken);

    /// <summary>
    /// The account's trip carrying this <c>Code</c>, or <c>null</c>. Both this and
    /// <see cref="FindByExternalReferenceAsync"/> are exact single-row reads against the per-account
    /// unique index.
    /// </summary>
    Task<TripVm?> FindByCodeAsync(Guid accountId, string code, CancellationToken cancellationToken);

    /// <summary>The account's trip carrying this <c>ExternalReference</c>, or <c>null</c>.</summary>
    Task<TripVm?> FindByExternalReferenceAsync(Guid accountId, string externalReference, CancellationToken cancellationToken);

    /// <summary>
    /// The owning trip of a stop, or <c>null</c> when the stop does not exist in the account or its
    /// trip is outside the caller's groups. The stop- and delivery-addressed
    /// commands carry no trip id, so this is how they apply the visibility predicate.
    /// </summary>
    Task<Guid?> FindVisibleTripIdByStopAsync(Guid tripStopId, Guid accountId, Guid? userId, CancellationToken cancellationToken);

    /// <summary>The owning trip of a delivery, under the same visibility rule as the stop lookup.</summary>
    Task<Guid?> FindVisibleTripIdByDeliveryAsync(Guid deliveryId, Guid accountId, Guid? userId, CancellationToken cancellationToken);

    /// <summary>
    /// True when the transporter exists AND belongs to the account. This is the account-boundary
    /// half of the transporter check that <c>IsTransporterVisibleAsync</c> does not perform: a
    /// principal that sees the whole account skips the group predicate but not this one, or a trip could
    /// point at another account's transporter, whose name the report readers resolve by unscoped id.
    /// </summary>
    Task<bool> TransporterExistsInAccountAsync(Guid transporterId, Guid accountId, CancellationToken cancellationToken);

    /// <summary>
    /// True when the geofence exists AND belongs to the account. A stop's <c>GeofenceId</c> is a
    /// cross-account reference and must be validated at write time: the arrival
    /// snapshot silently falls back to a radius buffer when the lookup misses, so an unvalidated id
    /// turns a detection failure into an apparent success.
    /// </summary>
    Task<bool> GeofenceExistsInAccountAsync(Guid geofenceId, Guid accountId, CancellationToken cancellationToken);

    /// <summary>
    /// The transporters this caller may plan for, by name — the resolution table a bulk upload
    /// matches its <c>transporter</c> column against.
    /// <para>
    /// Group visibility applies exactly as it does everywhere else: a scoped dispatcher's upload
    /// cannot name a vehicle they cannot see, and an unresolved name reports the same error whether
    /// the vehicle is absent or merely invisible — a row must not become a way to enumerate another
    /// group's fleet.
    /// </para>
    /// </summary>
    Task<IReadOnlyCollection<NamedEntityVm>> GetTransporterNamesAsync(Guid accountId, Guid? userId, CancellationToken cancellationToken);

    /// <summary>The account's active staff by name, for the same resolution pass.</summary>
    Task<IReadOnlyCollection<NamedEntityVm>> GetStaffNamesAsync(Guid accountId, CancellationToken cancellationToken);

    /// <summary>Paged export feed drained by Reporting at 500 rows a page.</summary>
    Task<TripsPageVm> GetReportDataAsync(
        Guid accountId,
        Guid? userId,
        DateTimeOffset from,
        DateTimeOffset to,
        Guid? transporterId,
        Guid? staffId,
        int skip,
        int take,
        CancellationToken cancellationToken);

    /// <summary>True when the acting user's groups cover the transporter (or the user sees all).</summary>
    Task<bool> IsTransporterVisibleAsync(Guid accountId, Guid userId, Guid transporterId, CancellationToken cancellationToken);

    // Reporting export feeds. Four paged drains, not one: the six catalogued trip
    // reports are trip-level, stop-level, station-level and POD-level, so a single trip feed would
    // force Reporting to re-expand rows it cannot see. All four apply the SAME group visibility as
    // the list and detail paths and page at 500.

    /// <summary>Trip-level rows with display names and the route-plan/toll roll-up folded in.</summary>
    Task<TripReportPageVm> GetTripReportRowsAsync(
        Guid accountId,
        Guid? userId,
        DateTimeOffset from,
        DateTimeOffset to,
        Guid? transporterId,
        Guid? staffId,
        int skip,
        int take,
        CancellationToken cancellationToken);

    /// <summary>Stop-level rows with delivery outcome counts.</summary>
    Task<TripStopReportPageVm> GetTripStopReportRowsAsync(
        Guid accountId,
        Guid? userId,
        DateTimeOffset from,
        DateTimeOffset to,
        Guid? transporterId,
        Guid? staffId,
        int skip,
        int take,
        CancellationToken cancellationToken);

    /// <summary>
    /// One row per route-plan/station match. A match with no tariff for the class on the plan date
    /// MUST come back with a null amount and <c>HasTariff = false</c> — never zero.
    /// </summary>
    Task<TripTollReportPageVm> GetTripTollReportRowsAsync(
        Guid accountId,
        Guid? userId,
        DateTimeOffset from,
        DateTimeOffset to,
        Guid? transporterId,
        Guid? staffId,
        int skip,
        int take,
        CancellationToken cancellationToken);

    /// <summary>POD register rows, carrying a document COUNT rather than the documents.</summary>
    Task<TripPodReportPageVm> GetTripPodReportRowsAsync(
        Guid accountId,
        Guid? userId,
        DateTimeOffset from,
        DateTimeOffset to,
        Guid? transporterId,
        Guid? staffId,
        int skip,
        int take,
        CancellationToken cancellationToken);
}
