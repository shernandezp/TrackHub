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

using System.Text.Json;
using Microsoft.Extensions.Logging;
using TrackHub.Security.Domain.Constants;
using TrackHub.Security.Domain.Interfaces;
using TrackHub.Security.Domain.Models;
using TrackHub.Security.Domain.Records;

namespace TrackHub.Security.Application.Outbox;

/// <summary>The Manager-bound half of a user write, carried by <see cref="OutboxMessageTypes"/>.</summary>
public readonly record struct UserMirrorUpdate(Guid UserId, UpdateUserShrankDto User);

public sealed record OutboxDispatchResult(int Completed, int GaveUp);

/// <summary>
/// Drains the outbox: each message is one Manager call, retried with backoff until it succeeds or
/// the attempt budget runs out. Nothing here is account-scoped — the dispatcher runs as the service.
/// </summary>
public sealed class OutboxDispatcher(
    IOutboxReader reader,
    IOutboxWriter writer,
    IManagerWriter managerWriter,
    IManagerAuditWriter auditWriter,
    ILogger<OutboxDispatcher> logger)
{
    public const int BatchSize = 50;

    /// <summary>Completed messages are kept this long for diagnosis, then dropped.</summary>
    public static readonly TimeSpan CompletedRetention = TimeSpan.FromDays(14);

    /// <summary>A claim older than this is assumed to belong to an instance that died mid-dispatch.</summary>
    public static readonly TimeSpan ClaimTimeout = TimeSpan.FromMinutes(5);

    private static readonly string Owner = $"{Environment.MachineName}:{Environment.ProcessId}";

    public async Task<OutboxDispatchResult> DispatchDueAsync(CancellationToken cancellationToken)
    {
        await writer.ReclaimStaleAsync(DateTimeOffset.UtcNow - ClaimTimeout, cancellationToken);

        var due = await reader.GetDispatchableAsync(BatchSize, cancellationToken);
        var completed = 0;
        var gaveUp = 0;

        foreach (var message in due)
        {
            cancellationToken.ThrowIfCancellationRequested();

            // Another instance, or an overlapping cycle of this one, may already have taken it.
            if (!await writer.TryClaimAsync(message.OutboxMessageId, Owner, cancellationToken))
            {
                continue;
            }

            try
            {
                await DispatchAsync(message, cancellationToken);
                await writer.MarkCompletedAsync(message.OutboxMessageId, cancellationToken);
                completed++;
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (Exception exception)
            {
                await writer.MarkAttemptFailedAsync(message.OutboxMessageId, exception.Message, cancellationToken);

                if (message.AttemptCount + 1 >= OutboxPolicy.MaxAttempts)
                {
                    gaveUp++;
                    logger.LogError(exception,
                        "Outbox message {OutboxMessageId} ({MessageType}) exhausted its attempts; Manager is out of step with Security until it is replayed.",
                        message.OutboxMessageId, message.MessageType);
                }
                else
                {
                    logger.LogWarning(exception,
                        "Outbox message {OutboxMessageId} ({MessageType}) failed on attempt {AttemptCount}; it will be retried.",
                        message.OutboxMessageId, message.MessageType, message.AttemptCount + 1);
                }
            }
        }

        await writer.PurgeCompletedAsync(DateTimeOffset.UtcNow - CompletedRetention, cancellationToken);

        return new OutboxDispatchResult(completed, gaveUp);
    }

    private async Task DispatchAsync(OutboxMessageVm message, CancellationToken cancellationToken)
    {
        switch (message.MessageType)
        {
            case OutboxMessageTypes.UserCreated:
                await managerWriter.CreateUserAsync(Payload<UserShrankDto>(message), cancellationToken);
                break;

            case OutboxMessageTypes.UserUpdated:
                var update = Payload<UserMirrorUpdate>(message);
                await managerWriter.UpdateUserAsync(update.UserId, update.User, cancellationToken);
                break;

            case OutboxMessageTypes.UserDeleted:
                await managerWriter.DeleteUserAsync(Payload<Guid>(message), cancellationToken);
                break;

            case OutboxMessageTypes.AuditEvent:
                await auditWriter.ForwardAuditEventAsync(Payload<SecurityAuditEventDto>(message), cancellationToken);
                break;

            default:
                throw new InvalidOperationException($"Unknown outbox message type '{message.MessageType}'.");
        }
    }

    private static T Payload<T>(OutboxMessageVm message)
        => JsonSerializer.Deserialize<T>(message.PayloadJson)
            ?? throw new InvalidOperationException($"Outbox message {message.OutboxMessageId} has an unreadable payload.");
}
