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

using Common.Application.Exceptions;
using Common.Application.GraphQL.Inputs;
using Common.Domain.Helpers;
using FluentValidation.Results;

namespace Common.Application.Extensions;

public static class FiltersExtensions
{
    /// <summary>
    /// Builds the filter set for a query, refusing any key outside the surface's allow-list.
    /// </summary>
    /// <remarks>
    /// Filter keys reach <see cref="System.Linq.Expressions.Expression.Property(System.Linq.Expressions.Expression, string)"/>,
    /// so without an allow-list a caller can filter an entity on columns the projection never
    /// returns — including a password hash, which turns a list endpoint into an equality oracle.
    /// </remarks>
    public static Filters GetFilters(this FiltersInput filtersInput, IReadOnlySet<string> allowedKeys)
    {
        ArgumentNullException.ThrowIfNull(filtersInput);
        ArgumentNullException.ThrowIfNull(allowedKeys);

        var failures = filtersInput.Filters
            .Where(f => !allowedKeys.Contains(f.Key))
            .Select(f => new ValidationFailure(nameof(FiltersInput.Filters),
                $"'{f.Key}' is not a filterable field. Allowed: {string.Join(", ", allowedKeys.Order())}."))
            .ToList();

        if (failures.Count > 0)
        {
            throw new Common.Application.Exceptions.ValidationException(failures);
        }

        return new Filters(filtersInput.Filters.ToDictionary(f => f.Key, f => f.Value));
    }
}
