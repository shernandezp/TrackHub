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
using System.Linq.Expressions;
using System.Reflection;

namespace Common.Domain.Helpers;

public class Filters(Dictionary<string, object> filters)
{
    private readonly Dictionary<string, object> _filters = filters ?? [];

    public IReadOnlyCollection<string> Keys => _filters.Keys;

    public IQueryable<T> Apply<T>(IQueryable<T> query)
    {
        foreach (var filter in _filters)
        {
            query = ApplyFilter(query, filter.Key, filter.Value);
        }
        return query;
    }

    private static IQueryable<T> ApplyFilter<T>(IQueryable<T> query, string propertyName, object value)
    {
        var property = typeof(T).GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase)
            ?? throw new ArgumentException($"'{propertyName}' is not a property of {typeof(T).Name}.", nameof(propertyName));

        var parameter = Expression.Parameter(typeof(T), "e");
        var member = Expression.Property(parameter, property);
        // Typed explicitly: an AnyType value arriving as the wrong CLR type (a string for a Guid
        // column) makes Expression.Equal throw at query time, which surfaces as a 500.
        var constant = Expression.Constant(Coerce(value, property.PropertyType), property.PropertyType);
        var lambda = Expression.Lambda<Func<T, bool>>(Expression.Equal(member, constant), parameter);

        return query.Where(lambda);
    }

    private static object? Coerce(object? value, Type targetType)
    {
        var underlying = Nullable.GetUnderlyingType(targetType) ?? targetType;

        if (value is null)
        {
            return underlying == targetType && underlying.IsValueType
                ? throw new ArgumentException($"A null value cannot be compared against {targetType.Name}.", nameof(value))
                : null;
        }

        if (underlying.IsInstanceOfType(value))
        {
            return value;
        }

        var text = Convert.ToString(value, CultureInfo.InvariantCulture)
            ?? throw new ArgumentException($"The value cannot be converted to {underlying.Name}.", nameof(value));

        if (underlying == typeof(Guid))
            return Guid.Parse(text);
        if (underlying == typeof(DateTimeOffset))
            return DateTimeOffset.Parse(text, CultureInfo.InvariantCulture);
        if (underlying == typeof(DateOnly))
            return DateOnly.Parse(text, CultureInfo.InvariantCulture);
        if (underlying.IsEnum)
            return Enum.Parse(underlying, text, ignoreCase: true);

        return Convert.ChangeType(value, underlying, CultureInfo.InvariantCulture);
    }
}
