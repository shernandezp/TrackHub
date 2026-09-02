/**
 * Copyright (c) 2025 Sergio Hernandez. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

namespace Common.Domain.Time;

/// <summary>
/// The calendar an ACCOUNT lives in. The servers run on UTC and every instant the platform stores
/// is UTC; every "today", "which day does this instant belong to" and day-bucket boundary is a
/// calendar question whose answer depends on where the customer operates. Each account carries an
/// IANA zone (Manager, <c>accounts.timezoneid</c>); this type turns instants into days for it, and
/// <see cref="IAccountTimeZoneResolver"/> is how a service obtains the calendar of an account.
/// </summary>
public sealed class AccountTimeZone
{
    /// <summary>What an account carries until somebody sets its zone, and the fallback everywhere.</summary>
    public const string DefaultId = "UTC";

    private AccountTimeZone(TimeZoneInfo zone) => Zone = zone;

    public static AccountTimeZone Utc { get; } = new(TimeZoneInfo.Utc);

    /// <summary>The IANA name (for example <c>America/Bogota</c>); <c>UTC</c> for the default.</summary>
    public string Id => Zone.Id;

    public TimeZoneInfo Zone { get; }

    public static bool IsValid(string? timeZoneId)
        => !string.IsNullOrWhiteSpace(timeZoneId) && TimeZoneInfo.TryFindSystemTimeZoneById(timeZoneId.Trim(), out _);

    /// <summary>A blank id becomes the default; anything else is trimmed and kept as written.</summary>
    public static string Normalize(string? timeZoneId, string fallbackId = DefaultId)
        => string.IsNullOrWhiteSpace(timeZoneId) ? fallbackId : timeZoneId.Trim();

    /// <summary>Resolves a name that was validated on the way in; a name this host no longer knows falls back to UTC.</summary>
    public static AccountTimeZone For(string? timeZoneId)
    {
        if (string.IsNullOrWhiteSpace(timeZoneId))
        {
            return Utc;
        }

        return TimeZoneInfo.TryFindSystemTimeZoneById(timeZoneId.Trim(), out var zone) ? new AccountTimeZone(zone) : Utc;
    }

    /// <summary>The current calendar day in the account's zone.</summary>
    public DateOnly Today() => DateOf(DateTimeOffset.UtcNow);

    /// <summary>The calendar day an instant falls on in the account's zone.</summary>
    public DateOnly DateOf(DateTimeOffset instant)
        => DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(instant, Zone).DateTime);

    /// <summary>The wall-clock time an instant reads as in the account's zone.</summary>
    public TimeOnly ClockOf(DateTimeOffset instant)
        => TimeOnly.FromDateTime(TimeZoneInfo.ConvertTime(instant, Zone).DateTime);

    /// <summary>The instant a calendar day starts in the account's zone.</summary>
    public DateTimeOffset StartOf(DateOnly day)
    {
        var local = day.ToDateTime(TimeOnly.MinValue, DateTimeKind.Unspecified);
        // A day that starts inside a DST gap has no 00:00; the first valid instant after it is used.
        if (Zone.IsInvalidTime(local))
        {
            local = local.AddHours(1);
        }

        return new DateTimeOffset(local, Zone.GetUtcOffset(local));
    }

    /// <summary>The instant the NEXT day starts: the exclusive upper bound of the day.</summary>
    public DateTimeOffset EndOf(DateOnly day) => StartOf(day.AddDays(1));
}

/// <summary>
/// Answers the calendar of an account. Manager reads its own table; every other service asks
/// Manager and caches the answer, since a zone changes about as often as the customer moves office.
/// </summary>
public interface IAccountTimeZoneResolver
{
    Task<AccountTimeZone> ResolveAsync(Guid accountId, CancellationToken cancellationToken);
}

/// <summary>
/// Answers UTC for every account. The fallback a component uses when no resolver was supplied
/// (unit tests construct readers and services by hand), so behaviour stays what it was before
/// accounts carried a zone.
/// </summary>
public sealed class UtcAccountTimeZoneResolver : IAccountTimeZoneResolver
{
    public static UtcAccountTimeZoneResolver Instance { get; } = new();

    public Task<AccountTimeZone> ResolveAsync(Guid accountId, CancellationToken cancellationToken)
        => Task.FromResult(AccountTimeZone.Utc);
}
