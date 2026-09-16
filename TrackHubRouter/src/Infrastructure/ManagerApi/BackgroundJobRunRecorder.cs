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

namespace TrackHub.Router.Infrastructure.ManagerApi;

// asService — recording a job run needs Platform/Write, which no user role holds.
public class BackgroundJobRunRecorder(IGraphQLClientFactory graphQLClient)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager, asService: true)), IBackgroundJobRunRecorder
{
    internal const string CreateBackgroundJobRunMutation = @"
                mutation($command: CreateBackgroundJobRunCommandInput!) {
                    createBackgroundJobRun(command: $command) { backgroundJobRunId }
                }";

    public async Task RecordAsync(
        string jobKey,
        string idempotencyKey,
        string status,
        DateTimeOffset startedAt,
        DateTimeOffset? completedAt,
        string? errorMessage,
        CancellationToken cancellationToken)
    {
        var request = new GraphQLRequest
        {
            Query = CreateBackgroundJobRunMutation,
            Variables = new
            {
                command = new
                {
                    backgroundJobRun = new
                    {
                        jobKey,
                        accountId = (Guid?)null,
                        resourceKey = (string?)null,
                        idempotencyKey,
                        status,
                        attempts = 1,
                        startedAt,
                        completedAt,
                        errorCode = (string?)null,
                        errorMessage,
                    },
                },
            },
        };

        await MutationAsync<object>(request, cancellationToken);
    }
}
