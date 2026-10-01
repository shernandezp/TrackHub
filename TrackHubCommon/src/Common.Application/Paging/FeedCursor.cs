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

using System.Globalization;
using System.Text;
using FluentValidation.Results;

namespace Common.Application.Paging;

/// <summary>
/// The page marker for an APPEND-ONLY feed: the (instant, id) of the last row a page returned.
/// <para>
/// Offset paging over these is O(offset) — the database walks and discards every skipped row, and
/// past a few thousand the planner abandons the ordered index scan and sorts the whole match set.
/// A cursor turns that into a range seek that costs the same on page one and page ten thousand, and
/// it cannot repeat or drop a row when new ones arrive at the head while someone is reading.
/// </para>
/// </summary>
public static class FeedCursor
{
    public const string InvalidCursorCode = "INVALID_CURSOR";

    public static string Encode(DateTimeOffset at, Guid id)
        => Convert.ToBase64String(Encoding.UTF8.GetBytes(
            $"{at.UtcDateTime.ToString("O", CultureInfo.InvariantCulture)}|{id:D}"));

    /// <summary>
    /// Returns false when no cursor was sent; throws for a malformed one: reading it as "start over"
    /// would hand a paging client page one again and loop it forever.
    /// </summary>
    public static bool TryDecode(string? cursor, out DateTimeOffset at, out Guid id)
    {
        at = default;
        id = default;

        if (string.IsNullOrWhiteSpace(cursor))
        {
            return false;
        }

        Span<byte> buffer = stackalloc byte[128];
        if (Convert.TryFromBase64String(cursor, buffer, out var written)
            && Encoding.UTF8.GetString(buffer[..written]).Split('|') is [var instant, var key]
            && DateTimeOffset.TryParse(instant, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out at)
            && Guid.TryParse(key, out id))
        {
            return true;
        }

        throw new Exceptions.ValidationException(InvalidCursorCode,
            [new ValidationFailure("cursor", "The cursor is malformed. Restart paging without a cursor.")]);
    }
}
