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

namespace TrackHub.Security.Domain.Interfaces;

public interface IOutboxWriter
{
    /// <param name="orderingKey">The entity the message is about; messages sharing a key are dispatched in write order.</param>
    Task EnqueueAsync(string messageType, string payloadJson, string? orderingKey, CancellationToken cancellationToken);

    Task MarkCompletedAsync(Guid outboxMessageId, CancellationToken cancellationToken);

    /// <summary>Records the failure and schedules the retry, or gives up at <c>MaxAttempts</c>.</summary>
    Task MarkAttemptFailedAsync(Guid outboxMessageId, string error, CancellationToken cancellationToken);

    /// <summary>Drops completed messages older than <paramref name="before"/>; the table is a queue, not a log.</summary>
    Task<int> PurgeCompletedAsync(DateTimeOffset before, CancellationToken cancellationToken);
}

public interface IOutboxReader
{
    /// <summary>Due messages, at most the oldest pending one per ordering key.</summary>
    Task<IReadOnlyCollection<OutboxMessageVm>> GetDispatchableAsync(int take, CancellationToken cancellationToken);
}
