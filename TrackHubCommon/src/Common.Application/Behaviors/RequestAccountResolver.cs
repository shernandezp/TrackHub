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

using System.Collections;
using System.Collections.Concurrent;
using System.Reflection;

namespace Common.Application.Behaviors;

/// <summary>
/// Single source of truth for which account a request names, shared by the scope, status and feature
/// behaviors so they always evaluate the same account. The <c>AccountId</c> may sit inside a DTO member,
/// so the lookup recurses breadth-first up to <see cref="MaxNestingDepth"/> levels, only into TrackHub-owned
/// non-collection types (a collection names many accounts and must be marked cross-account). A shallower
/// match wins, ties resolve by ordinal property name, and the path is cached per request type.
/// </summary>
public static class RequestAccountResolver
{
    /// <summary>
    /// Shared with <see cref="Testing.AccountScopeCoverage"/> so the coverage walk and the account walk agree on reach.
    /// </summary>
    internal const int MaxNestingDepth = 2;

    private const BindingFlags PublicInstance = BindingFlags.Public | BindingFlags.Instance;

    private static readonly ConcurrentDictionary<Type, PropertyInfo[]?> AccountIdPaths = new();

    /// <summary>
    /// Deliberately does not fall back to the principal; callers decide whether a fallback is meaningful.
    /// </summary>
    public static Guid? GetRequestAccountId<TRequest>(TRequest request)
    {
        var path = AccountIdPaths.GetOrAdd(typeof(TRequest), static type => FindAccountIdPath(type));

        return ReadAccountId(request, path);
    }

    /// <summary>
    /// A type returning <c>false</c> must be marked platform-scoped or cross-account, or reach the guard
    /// under a principal that carries an account. Type-only, for the per-service enforcement tests.
    /// </summary>
    public static bool NamesAccount(Type requestType)
        => AccountIdPaths.GetOrAdd(requestType, static type => FindAccountIdPath(type)) is not null;

    private static Guid? ReadAccountId(object? request, PropertyInfo[]? path)
    {
        if (path is null)
        {
            return null;
        }

        object? current = request;
        foreach (var step in path)
        {
            if (current is null)
            {
                return null;
            }

            current = step.GetValue(current);
        }

        return current is Guid guid && guid != Guid.Empty ? guid : null;
    }

    private static PropertyInfo[]? FindAccountIdPath(Type requestType)
    {
        var frontier = new List<PropertyInfo[]> { Array.Empty<PropertyInfo>() };

        for (var depth = 0; depth <= MaxNestingDepth && frontier.Count > 0; depth++)
        {
            var next = new List<PropertyInfo[]>();

            foreach (var prefix in frontier)
            {
                var owner = prefix.Length == 0 ? requestType : UnwrapNullable(prefix[^1].PropertyType);

                var accountId = GetAccountIdProperty(owner);
                if (accountId is not null)
                {
                    return [.. prefix, accountId];
                }

                if (depth == MaxNestingDepth)
                {
                    continue;
                }

                foreach (var candidate in GetRecursableProperties(owner))
                {
                    next.Add([.. prefix, candidate]);
                }
            }

            frontier = next;
        }

        return null;
    }

    private static PropertyInfo? GetAccountIdProperty(Type type)
    {
        var property = FindProperty(type, "AccountId") ?? FindProperty(type, "accountId");

        return property is not null && UnwrapNullable(property.PropertyType) == typeof(Guid)
            ? property
            : null;
    }

    private static PropertyInfo? FindProperty(Type type, string name)
    {
        try
        {
            var property = type.GetProperty(name, PublicInstance);
            return IsReadable(property) ? property : null;
        }
        catch (AmbiguousMatchException)
        {
            // A shadowed property ('new AccountId') is not a scope the guard can resolve
            // unambiguously; treat it as absent rather than guessing which declaration wins.
            return null;
        }
    }

    /// <summary>Shared with <see cref="Testing.AccountScopeCoverage"/> so both walks descend identically.</summary>
    internal static IEnumerable<PropertyInfo> GetRecursableProperties(Type type)
        => type.GetProperties(PublicInstance)
            .Where(property => IsReadable(property) && IsTrackHubComplexType(UnwrapNullable(property.PropertyType)))
            .OrderBy(property => property.Name, StringComparer.Ordinal);

    internal static bool IsReadable(PropertyInfo? property)
        => property is { CanRead: true } && property.GetIndexParameters().Length == 0;

    private static bool IsTrackHubComplexType(Type type)
    {
        if (type.IsPrimitive || type.IsEnum || type == typeof(string) || typeof(IEnumerable).IsAssignableFrom(type))
        {
            return false;
        }

        var assemblyName = type.Assembly.GetName().Name;

        return assemblyName is not null
            && (assemblyName.StartsWith("TrackHub", StringComparison.Ordinal)
                || assemblyName.StartsWith("Common.", StringComparison.Ordinal));
    }

    internal static Type UnwrapNullable(Type type)
        => Nullable.GetUnderlyingType(type) ?? type;
}
