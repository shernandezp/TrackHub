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

namespace TrackHub.Security.Domain.Constants;

/// <summary>
/// The user-mirror and audit calls Security owes Manager. Each is recorded before it is attempted,
/// so a Manager outage leaves a durable row to retry instead of a Security user with no replica.
/// </summary>
public static class OutboxMessageTypes
{
    public const string UserCreated = nameof(UserCreated);
    public const string UserUpdated = nameof(UserUpdated);
    public const string UserDeleted = nameof(UserDeleted);
    public const string AuditEvent = nameof(AuditEvent);
}

public static class OutboxMessageStatuses
{
    public const string Pending = nameof(Pending);
    public const string Completed = nameof(Completed);
    public const string Failed = nameof(Failed);

    /// <summary>Claimed by one dispatcher instance and in flight. Reclaimed if the claim goes stale.</summary>
    public const string Dispatching = nameof(Dispatching);
}

public static class OutboxPolicy
{
    public const int MaxAttempts = 8;

    /// <summary>Exponential backoff, capped: 30 s, 1 min, 2 min, … 30 min.</summary>
    public static TimeSpan BackoffFor(int attemptCount)
        => TimeSpan.FromSeconds(Math.Min(30 * Math.Pow(2, Math.Max(0, attemptCount - 1)), 1800));
}
