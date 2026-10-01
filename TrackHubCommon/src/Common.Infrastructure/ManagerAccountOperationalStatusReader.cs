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

using Common.Application.Interfaces;
using Common.Domain.Constants;
using Common.Domain.Enums;
using GraphQL;

namespace Common.Infrastructure;

// Account status for services that do not map Manager's app.accounts: read through Manager under
// the host's own service identity. Returns null for an unknown account (Manager answers 0).
public sealed class ManagerAccountOperationalStatusReader(IGraphQLClientFactory graphQLClient)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager, asService: true)), IAccountOperationalStatusReader
{
    internal const string AccountStatusQuery = @"
                query($accountId: UUID!) {
                    accountStatus(query: { accountId: $accountId })
                }";

    public async Task<AccountStatus?> GetAccountStatusAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var request = new GraphQLRequest
        {
            Query = AccountStatusQuery,
            Variables = new { accountId }
        };

        var status = await QueryAsync<short>(request, cancellationToken);
        return status == 0 ? null : (AccountStatus)status;
    }
}
