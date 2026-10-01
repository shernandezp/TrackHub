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

using TrackHub.Router.Domain.Helpers;
using TrackHub.Router.Domain.Interfaces;

namespace TrackHub.Router.Infrastructure.ManagerApi;

public sealed class OperatorSyncBackoff(IGraphQLClientFactory graphQLClient)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager, asService: true)), IOperatorSyncBackoff
{
    internal const string SetOperatorSyncBackoffMutation = @"
                mutation($command: SetOperatorSyncBackoffCommandInput!) {
                    setOperatorSyncBackoff(command: $command)
                }";

    internal const string ClearOperatorSyncBackoffMutation = @"
                mutation($command: ClearOperatorSyncBackoffCommandInput!) {
                    clearOperatorSyncBackoff(command: $command)
                }";

    public async Task RecordSuccessAsync(OperatorVm @operator, CancellationToken cancellationToken)
    {
        if (@operator.SyncFailureCount == 0)
        {
            return;
        }

        await MutationAsync<object>(new GraphQLRequest
        {
            Query = ClearOperatorSyncBackoffMutation,
            Variables = new { command = new { operatorId = @operator.OperatorId } }
        }, cancellationToken);
    }

    public async Task RecordFailureAsync(OperatorVm @operator, DateTimeOffset now, CancellationToken cancellationToken)
    {
        var consecutiveFailures = @operator.SyncFailureCount + 1;
        await MutationAsync<object>(new GraphQLRequest
        {
            Query = SetOperatorSyncBackoffMutation,
            Variables = new
            {
                command = new
                {
                    operatorId = @operator.OperatorId,
                    consecutiveFailures,
                    retryAt = OperatorSyncBackoffPolicy.NextRetryAt(consecutiveFailures, now)
                }
            }
        }, cancellationToken);
    }
}
