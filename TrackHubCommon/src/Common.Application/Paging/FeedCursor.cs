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
    public static string Encode(DateTimeOffset at, Guid id)
        => Convert.ToBase64String(Encoding.UTF8.GetBytes(
            $"{at.UtcDateTime.ToString("O", CultureInfo.InvariantCulture)}|{id:D}"));

    /// <summary>
    /// Returns false for anything that is not a cursor this class produced. A malformed marker reads
    /// as "start from the beginning", never as an error: it is an opaque token the caller echoes
    /// back, and one truncated by a URL is not worth a 400.
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
        if (!Convert.TryFromBase64String(cursor, buffer, out var written))
        {
            return false;
        }

        var parts = Encoding.UTF8.GetString(buffer[..written]).Split('|');

        return parts.Length == 2
            && DateTimeOffset.TryParse(parts[0], CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out at)
            && Guid.TryParse(parts[1], out id);
    }
}
