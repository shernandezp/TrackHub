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

using FluentValidation.Results;

namespace Common.Application.Paging;

/// <summary>
/// The ceiling every picker lookup shares. Lookups are deliberately unpaged — a select control that
/// silently drops options is the defect this whole surface exists to avoid — so the reader fetches
/// <see cref="Ceiling"/> + 1 rows and the handler raises here when the extra row comes back. A
/// lookup that quietly capped would reintroduce exactly the silent truncation it replaced.
/// </summary>
public static class LookupLimits
{
    /// <summary>Largest lookup a picker may bind. Fleet sizes reach ~3000, so this leaves headroom.</summary>
    public const int Ceiling = 5000;

    /// <summary>Rows to request: one past the ceiling, so an over-ceiling set is detectable.</summary>
    public const int FetchSize = Ceiling + 1;

    public const string LimitExceededCode = "LOOKUP_LIMIT_EXCEEDED";

    /// <summary>
    /// Returns <paramref name="rows"/> unchanged when it fits the ceiling; raises otherwise.
    /// </summary>
    public static IReadOnlyCollection<T> EnsureWithinCeiling<T>(IReadOnlyCollection<T> rows, string lookupName)
        => rows.Count <= Ceiling
            ? rows
            : throw new Exceptions.ValidationException(LimitExceededCode,
            [
                new ValidationFailure(lookupName,
                    $"The {lookupName} lookup returned more than {Ceiling} records. Narrow the request instead of binding a truncated list.")
            ]);
}
