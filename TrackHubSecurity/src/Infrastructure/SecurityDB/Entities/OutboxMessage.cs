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

namespace TrackHub.Security.Infrastructure.Entities;

/// <summary>
/// A cross-service call Security owes Manager, recorded so a transport failure is retried instead
/// of silently leaving a Security user without its Manager replica.
/// </summary>
public sealed class OutboxMessage(string messageType, string payloadJson, string? orderingKey) : BaseEntity
{
    public Guid OutboxMessageId { get; private set; } = Guid.NewGuid();

    /// <summary>Database-assigned creation order. The dispatcher depends on it for per-entity ordering.</summary>
    public long Sequence { get; private set; }

    /// <summary>The entity this message is about (a user id), or null when order does not matter.</summary>
    public string? OrderingKey { get; set; } = orderingKey;
    public string MessageType { get; set; } = messageType;
    public string PayloadJson { get; set; } = payloadJson;
    public string Status { get; set; } = OutboxMessageStatuses.Pending;
    public int AttemptCount { get; set; }
    public DateTimeOffset NextAttemptAt { get; set; } = DateTimeOffset.UtcNow;
    public string? LastError { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ProcessedAt { get; set; }
    public string? ClaimedBy { get; set; }
    public DateTimeOffset? ClaimedAt { get; set; }
}
