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

using TrackHub.Reporting.Domain.Interfaces.Manager;
using TrackHub.Reporting.Domain.Models;

using TrackHub.Reporting.Domain.Paging;

namespace TrackHub.Reporting.Infrastructure.GraphQLApi;

// Every Manager read below is paged at the source. These reports must export the COMPLETE set — a
// short groupsByAccount silently drops entire groups from the membership export's outer loop — so
// each one drains its pages and raises past the report limit instead of returning what fit.
public class AdminReportReader(IGraphQLClientFactory graphQLClient)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager)), IAdminReportReader
{
    internal const string AccountsQuery = @"
                query($skip: Int!, $take: Int!) {
                    accounts(query: { skip: $skip, take: $take }) {
                        items {
                            accountId
                            name
                            status
                            statusId
                            typeId
                            active
                            lastModified
                        }
                        totalCount
                    }
                }";

    // The master feed is paged: it spans every tenant, so an unpaged read grows without bound.
    // Batched master read: every account's features (the matrix report previously fanned out one
    // accountFeaturesMaster call per account).
    internal const string AllAccountFeaturesMasterQuery = @"
                query($skip: Int!, $take: Int!) {
                    allAccountFeaturesMaster(query: { skip: $skip, take: $take }) {
                        accountId
                        featureKey
                        enabled
                        tier
                    }
                }";

    internal const string GroupsByAccountQuery = @"
                query($skip: Int!, $take: Int!) {
                    groupsByAccount(query: { skip: $skip, take: $take }) {
                        items {
                            groupId
                            name
                            active
                            accountId
                        }
                        totalCount
                    }
                }";

    internal const string UsersByGroupQuery = @"
                query($groupId: Long!, $skip: Int!, $take: Int!) {
                    usersByGroup(query: { groupId: $groupId, skip: $skip, take: $take }) {
                        items {
                            userId
                            username
                        }
                        totalCount
                    }
                }";

    internal const string TransportersByGroupQuery = @"
                query($groupId: Long!, $skip: Int!, $take: Int!) {
                    transportersByGroup(query: { groupId: $groupId, skip: $skip, take: $take }) {
                        items {
                            transporterId
                            name
                        }
                        totalCount
                    }
                }";

    public Task<IReadOnlyCollection<AdminAccountVm>> GetAccountsAsync(CancellationToken cancellationToken)
        => ManagerPageDrain.FetchAllAsync<AdminAccountVm>(
            (skip, take) => new GraphQLRequest { Query = AccountsQuery, Variables = new { skip, take } },
            (request, token) => QueryAsync<ManagerPage<AdminAccountVm>>(request, token),
            cancellationToken);

    public Task<IReadOnlyCollection<AdminAccountFeatureVm>> GetAllAccountFeaturesAsync(CancellationToken cancellationToken)
        => FeedDrain.DrainByNextSkipAsync<AdminAccountFeatureVm>(async (skip, take) =>
        {
            var page = await QueryAsync<List<AdminAccountFeatureVm>>(new GraphQLRequest
            {
                Query = AllAccountFeaturesMasterQuery,
                Variables = new { skip, take }
            }, cancellationToken);
            return (page, page.Count == take, skip + page.Count);
        });

    public Task<IReadOnlyCollection<AdminGroupVm>> GetGroupsByAccountAsync(CancellationToken cancellationToken)
        => ManagerPageDrain.FetchAllAsync<AdminGroupVm>(
            (skip, take) => new GraphQLRequest { Query = GroupsByAccountQuery, Variables = new { skip, take } },
            (request, token) => QueryAsync<ManagerPage<AdminGroupVm>>(request, token),
            cancellationToken);

    public Task<IReadOnlyCollection<AdminUserVm>> GetUsersByGroupAsync(long groupId, CancellationToken cancellationToken)
        => ManagerPageDrain.FetchAllAsync<AdminUserVm>(
            (skip, take) => new GraphQLRequest { Query = UsersByGroupQuery, Variables = new { groupId, skip, take } },
            (request, token) => QueryAsync<ManagerPage<AdminUserVm>>(request, token),
            cancellationToken);

    public Task<IReadOnlyCollection<AdminTransporterVm>> GetTransportersByGroupAsync(long groupId, CancellationToken cancellationToken)
        => ManagerPageDrain.FetchAllAsync<AdminTransporterVm>(
            (skip, take) => new GraphQLRequest { Query = TransportersByGroupQuery, Variables = new { groupId, skip, take } },
            (request, token) => QueryAsync<ManagerPage<AdminTransporterVm>>(request, token),
            cancellationToken);
}
