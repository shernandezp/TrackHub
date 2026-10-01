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

using TrackHub.Reporting.Domain.Interfaces;
using TrackHub.Reporting.Domain.Interfaces.Manager;
using TrackHub.Reporting.Domain.Models;
using TrackHub.Reporting.Domain.Paging;

namespace TrackHub.Reporting.Infrastructure.GraphQLApi;

public class WorkforceReportReader(IGraphQLClientFactory graphQLClient, IUser user, IAccountFeatureReader featureReader)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager)), IWorkforceReportReader
{
    internal const string DriversByAccountQuery = @"
                query($accountId: UUID!, $skip: Int!, $take: Int!) {
                    driversByAccount(query: { accountId: $accountId, skip: $skip, take: $take }) {
                        items { driverId name phone documentType documentNumber active employeeCode licenseNumber licenseExpiresAt defaultTransporterId }
                        totalCount
                    }
                }";

    internal const string DriverQualificationsQuery = @"
                query($accountId: UUID!, $driverId: UUID, $expiringWithinDays: Int, $skip: Int!, $take: Int!) {
                    driverQualifications(query: { accountId: $accountId, driverId: $driverId, expiringWithinDays: $expiringWithinDays, skip: $skip, take: $take }) {
                        items { driverQualificationId driverId driverName qualificationType category number issuedAt expiresAt issuingAuthority status }
                        totalCount
                    }
                }";

    internal const string DriverAssignmentHistoryQuery = @"
                query($accountId: UUID!, $driverId: UUID, $transporterId: UUID, $from: DateTime, $to: DateTime, $skip: Int!, $take: Int!) {
                    driverAssignmentHistory(query: { accountId: $accountId, driverId: $driverId, transporterId: $transporterId, from: $from, to: $to, skip: $skip, take: $take }) {
                        items { driverId driverName transporterId transporterName startsAt endsAt assignmentType status createdByPrincipal }
                        totalCount
                    }
                }";

    private Guid AccountId => user.AccountId ?? throw new UnauthorizedAccessException();

    public Task EnsureWorkforceFeatureAsync(CancellationToken cancellationToken)
        => featureReader.EnsureFeatureEnabledAsync(AccountId, FeatureKeys.Workforce, cancellationToken);

    public Task<IReadOnlyCollection<ReportDriverVm>> GetDriversAsync(CancellationToken cancellationToken)
        => DrainAsync<ReportDriverVm>(DriversByAccountQuery, (skip, take) => new { accountId = AccountId, skip, take }, cancellationToken);

    public Task<IReadOnlyCollection<ReportDriverQualificationVm>> GetDriverQualificationsAsync(
        Guid? driverId, int? expiringWithinDays, CancellationToken cancellationToken)
        => DrainAsync<ReportDriverQualificationVm>(DriverQualificationsQuery,
            (skip, take) => new { accountId = AccountId, driverId, expiringWithinDays, skip, take }, cancellationToken);

    public Task<IReadOnlyCollection<ReportDriverAssignmentVm>> GetDriverAssignmentHistoryAsync(
        Guid? driverId, Guid? transporterId, DateTimeOffset? from, DateTimeOffset? to, CancellationToken cancellationToken)
        => DrainAsync<ReportDriverAssignmentVm>(DriverAssignmentHistoryQuery,
            (skip, take) => new { accountId = AccountId, driverId, transporterId, from, to, skip, take }, cancellationToken);

    private Task<IReadOnlyCollection<T>> DrainAsync<T>(string query, Func<int, int, object> variables, CancellationToken cancellationToken)
        => FeedDrain.DrainAsync<T>(async (skip, take) =>
        {
            var page = await QueryAsync<Page<T>>(new GraphQLRequest { Query = query, Variables = variables(skip, take) }, cancellationToken);
            return (page.Items, page.TotalCount);
        });

    private sealed record Page<T>(IReadOnlyCollection<T>? Items, int TotalCount);
}
