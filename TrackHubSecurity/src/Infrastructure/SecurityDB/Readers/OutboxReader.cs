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

using TrackHub.Security.Domain.Constants;
using TrackHub.Security.Domain.Interfaces;
using TrackHub.Security.Domain.Models;
using TrackHub.Security.Infrastructure.Interfaces;

namespace TrackHub.Security.Infrastructure.Readers;

public sealed class OutboxReader(IApplicationDbContext context) : IOutboxReader
{
    public async Task<IReadOnlyCollection<OutboxMessageVm>> GetDispatchableAsync(int take, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        var pending = await context.OutboxMessages.AsNoTracking()
            .Where(x => x.Status == OutboxMessageStatuses.Pending)
            .OrderBy(x => x.Sequence)
            .Take(take * 4)
            .Select(x => new
            {
                x.OutboxMessageId,
                x.MessageType,
                x.PayloadJson,
                x.AttemptCount,
                x.OrderingKey,
                x.NextAttemptAt,
            })
            .ToListAsync(cancellationToken);

        var blocked = new HashSet<string>(StringComparer.Ordinal);
        var dispatchable = new List<OutboxMessageVm>();

        foreach (var message in pending)
        {
            // Messages about one entity must reach Manager in the order they were written. Only the
            // OLDEST pending message per key is eligible; while it waits out a backoff the rest of
            // its key waits with it. Without this a delete overtakes its create and leaves a replica
            // in Manager that nothing will ever remove.
            if (message.OrderingKey is { } key && !blocked.Add(key))
            {
                continue;
            }

            if (message.NextAttemptAt > now)
            {
                continue;
            }

            dispatchable.Add(new OutboxMessageVm(
                message.OutboxMessageId, message.MessageType, message.PayloadJson, message.AttemptCount));

            if (dispatchable.Count == take)
            {
                break;
            }
        }

        return dispatchable;
    }
}
