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

using HotChocolate;
using TrackHub.Reporting.Domain.Interfaces;
using TrackHub.Reporting.Domain.Interfaces.Manager;
using TrackHub.Reporting.Domain.Models;
using TrackHub.Reporting.Domain.Paging;

namespace TrackHub.Reporting.Infrastructure.GraphQLApi;

public class DocumentReportReader(IGraphQLClientFactory graphQLClient, IUser user, IAccountFeatureReader featureReader)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager)), IDocumentReportReader
{
    internal const string ExpiringDocumentsQuery = @"
                query($withinDays: Int!, $skip: Int!, $take: Int!) {
                    expiringDocuments(query: { withinDays: $withinDays, skip: $skip, take: $take }) {
                        items { category ownerEntityType ownerEntityId fileName classification status expiresAt }
                        totalCount
                    }
                }";

    internal const string DocumentTypesQuery = @"
                query($accountId: UUID!) {
                    documentTypes(query: { accountId: $accountId, includeDisabled: false }) {
                        category required enabled
                    }
                }";

    // Batched compliance read: every group-visible transporter with its Active document
    // categories in one call (replaces groups → transporters-per-group → documents-per-owner).
    internal const string TransporterDocumentComplianceQuery = @"
                query($accountId: UUID!) {
                    transporterDocumentCompliance(query: { accountId: $accountId }) {
                        transporterId transporterName activeCategories
                    }
                }";

    internal const string SharesByAccountQuery = @"
                query($accountId: UUID!, $skip: Int!, $take: Int!) {
                    publicLinkGrantsByAccount(query: { accountId: $accountId, skip: $skip, take: $take }) {
                        items { resourceType resourceId scopes purpose expiresAt revokedAt accessCount lastAccessedAt }
                        totalCount
                    }
                }";

    internal const string SearchDocumentsQuery = @"
                query($from: DateTime, $to: DateTime, $skip: Int!, $take: Int!) {
                    searchDocuments(query: { filter: { from: $from, to: $to }, skip: $skip, take: $take }) {
                        items { category ownerEntityType ownerEntityId fileName classification status expiresAt }
                        totalCount
                    }
                }";

    private Guid AccountId => user.AccountId ?? throw new UnauthorizedAccessException();

    public Task EnsureDocumentsFeatureAsync(CancellationToken cancellationToken)
        => featureReader.EnsureFeatureEnabledAsync(AccountId, FeatureKeys.Documents, cancellationToken);

    public Task<IReadOnlyCollection<ReportDocumentVm>> GetExpiringDocumentsAsync(int withinDays, CancellationToken cancellationToken)
        => DrainAsync<ReportDocumentVm>(ExpiringDocumentsQuery, (skip, take) => new { withinDays, skip, take }, cancellationToken);

    public async Task<IReadOnlyCollection<ReportDocumentTypeVm>> GetDocumentTypesAsync(CancellationToken cancellationToken)
    {
        var request = new GraphQLRequest { Query = DocumentTypesQuery, Variables = new { accountId = AccountId } };
        return await QueryAsync<List<ReportDocumentTypeVm>>(request, cancellationToken);
    }

    public async Task<IReadOnlyCollection<TransporterDocumentComplianceVm>> GetTransporterDocumentComplianceAsync(CancellationToken cancellationToken)
    {
        var request = new GraphQLRequest { Query = TransporterDocumentComplianceQuery, Variables = new { accountId = AccountId } };
        return await QueryAsync<List<TransporterDocumentComplianceVm>>(request, cancellationToken);
    }

    public Task<IReadOnlyCollection<ReportShareVm>> GetDocumentSharesByAccountAsync(CancellationToken cancellationToken)
        => DrainAsync<ReportShareVm>(SharesByAccountQuery, (skip, take) => new { accountId = AccountId, skip, take }, cancellationToken);

    public Task<IReadOnlyCollection<ReportDocumentVm>> SearchDocumentsAsync(DateTimeOffset? from, DateTimeOffset? to, CancellationToken cancellationToken)
        => DrainAsync<ReportDocumentVm>(SearchDocumentsQuery, (skip, take) => new { from, to, skip, take }, cancellationToken);

    private Task<IReadOnlyCollection<T>> DrainAsync<T>(string query, Func<int, int, object> variables, CancellationToken cancellationToken)
        => FeedDrain.DrainAsync<T>(async (skip, take) =>
        {
            var page = await QueryAsync<Page<T>>(new GraphQLRequest { Query = query, Variables = variables(skip, take) }, cancellationToken);
            return (page.Items, page.TotalCount);
        });

    private sealed record Page<T>(IReadOnlyCollection<T>? Items, int TotalCount);
}
