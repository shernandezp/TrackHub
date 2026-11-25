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

namespace TrackHub.Security.Application.Lookups;

/// <summary>
/// The seeded permission catalogs are the axes of the permission matrix, so they are never paged;
/// one grown past anything a seeded set should reach raises instead of being trimmed.
/// </summary>
public static class SeededCatalogLimits
{
    public const int Ceiling = 1000;

    public const string LimitExceededCode = "SEEDED_CATALOG_LIMIT_EXCEEDED";

    public static IReadOnlyCollection<T> EnsureWithinCeiling<T>(IReadOnlyCollection<T> rows, string catalogName)
        => rows.Count <= Ceiling
            ? rows
            : throw new Common.Application.Exceptions.ValidationException(LimitExceededCode,
            [
                new ValidationFailure(catalogName,
                    $"The {catalogName} catalog holds more than {Ceiling} entries, far past the size a seeded catalog should reach.")
            ]);
}
