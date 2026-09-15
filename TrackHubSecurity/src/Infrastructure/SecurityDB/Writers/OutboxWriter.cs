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
using TrackHub.Security.Infrastructure.Interfaces;

namespace TrackHub.Security.Infrastructure.Writers;

/// <summary>
/// The outbox is platform plumbing, not tenant data: it is written on behalf of whoever triggered
/// the originating command and read only by the dispatcher, so it carries no account scoping.
/// </summary>
public sealed class OutboxWriter(IApplicationDbContext context) : IOutboxWriter
{
    public async Task EnqueueAsync(string messageType, string payloadJson, string? orderingKey, CancellationToken cancellationToken)
    {
        await context.OutboxMessages.AddAsync(new OutboxMessage(messageType, payloadJson, orderingKey), cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkCompletedAsync(Guid outboxMessageId, CancellationToken cancellationToken)
    {
        var message = await FindAsync(outboxMessageId, cancellationToken);
        if (message is null)
        {
            return;
        }

        message.Status = OutboxMessageStatuses.Completed;
        message.ProcessedAt = DateTimeOffset.UtcNow;
        message.LastError = null;
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task MarkAttemptFailedAsync(Guid outboxMessageId, string error, CancellationToken cancellationToken)
    {
        var message = await FindAsync(outboxMessageId, cancellationToken);
        if (message is null)
        {
            return;
        }

        message.AttemptCount++;
        message.LastError = error.Length > 2000 ? error[..2000] : error;

        if (message.AttemptCount >= OutboxPolicy.MaxAttempts)
        {
            message.Status = OutboxMessageStatuses.Failed;
            message.ProcessedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            message.NextAttemptAt = DateTimeOffset.UtcNow.Add(OutboxPolicy.BackoffFor(message.AttemptCount));
        }

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> PurgeCompletedAsync(DateTimeOffset before, CancellationToken cancellationToken)
        => await context.OutboxMessages
            .Where(x => x.Status == OutboxMessageStatuses.Completed && x.ProcessedAt != null && x.ProcessedAt < before)
            .ExecuteDeleteAsync(cancellationToken);

    // AsTracking: the Security context is globally NoTracking, so a plain read would mutate a
    // detached instance and save nothing.
    private async Task<OutboxMessage?> FindAsync(Guid outboxMessageId, CancellationToken cancellationToken)
        => await context.OutboxMessages.AsTracking()
            .FirstOrDefaultAsync(x => x.OutboxMessageId == outboxMessageId, cancellationToken);
}
