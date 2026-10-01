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
using System.Reflection;
using Common.Application.Attributes;
using Common.Application.Behaviors;
using Common.Mediator;

namespace Common.Application.Testing;

/// <summary>
/// Tenant-scope coverage (TS-06) — the SHARED engine behind every service's
/// <c>AccountScopeCoverageTests</c>. Each service's unit-test project asserts, against its own
/// Application assembly, that <see cref="UndeclaredKeyedRequests"/> returns empty. A request that
/// carries a wire entity key other than a required <c>AccountId</c> (a by-id/by-key <see cref="Guid"/>, a group <see cref="long"/>, or a
/// collection of them — at the root or inside a TrackHub-owned DTO member) could reference another
/// tenant's entity, so it MUST declare how its scope is enforced:
/// <see cref="AccountScopeEnforcedInHandlerAttribute"/> (the handler loads the entity and checks
/// caller access), <see cref="PlatformScopedAttribute"/> (platform-owned data), or
/// <see cref="AllowCrossAccountAttribute"/> (a service-identity cross-tenant surface). A keyless
/// request derives its account from the caller and needs no marker. This fails the build the
/// instant a new keyed request is added without declaring its scope — the guard that catches the
/// next by-id escape at test time, since handler-level unit tests never run the pipeline.
/// <para>
/// The wire-key walk deliberately shares <see cref="RequestAccountResolver"/>'s reach (same depth
/// bound, same TrackHub-owned-member descent): a key nested inside a DTO the resolver would walk is
/// found here too, so wrapping the key in a <c>FiltersInput</c>-style DTO cannot slip a keyed
/// request past the gate.
/// </para>
/// </summary>
public static class AccountScopeCoverage
{
    /// <summary>
    /// Request types in <paramref name="applicationAssembly"/> that carry a wire entity key other
    /// than a required <c>AccountId</c> and declare no scope marker. A key beside the account is a
    /// second hop the account check does not cover. Must be empty.
    /// </summary>
    public static IReadOnlyList<string> UndeclaredKeyedRequests(Assembly applicationAssembly)
        => RequestTypes(applicationAssembly)
            .Where(t => CarriesWireKey(t)
                && t.GetCustomAttribute<AccountScopeEnforcedInHandlerAttribute>(inherit: true) is null
                && t.GetCustomAttribute<PlatformScopedAttribute>(inherit: true) is null
                && t.GetCustomAttribute<AllowCrossAccountAttribute>(inherit: true) is null)
            .Select(t => t.FullName!)
            .OrderBy(n => n, StringComparer.Ordinal)
            .ToList();

    private static IEnumerable<Type> RequestTypes(Assembly assembly)
        => assembly.GetTypes()
            .Where(type => type is { IsAbstract: false, IsInterface: false }
                && type.GetInterfaces().Any(i =>
                    i == typeof(IRequest)
                    || (i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IRequest<>))));

    /// <summary>
    /// A wire entity key: a <c>Guid</c>/<c>Guid?</c>, <c>long</c>/<c>long?</c>, or a collection
    /// (excluding <see cref="string"/>) — anything that could name another tenant's entity — at the
    /// request root or inside a TrackHub-owned complex member, walked breadth-first to the same
    /// depth bound as <see cref="RequestAccountResolver"/>. Paging ints and filter strings are not
    /// keys and do not require a marker (those requests are scoped to the caller's own account).
    /// </summary>
    private static bool CarriesWireKey(Type requestType)
    {
        var frontier = new List<Type> { requestType };

        for (var depth = 0; depth <= RequestAccountResolver.MaxNestingDepth && frontier.Count > 0; depth++)
        {
            var next = new List<Type>();

            foreach (var owner in frontier)
            {
                if (HasOwnWireKey(owner))
                {
                    return true;
                }

                if (depth == RequestAccountResolver.MaxNestingDepth)
                {
                    continue;
                }

                next.AddRange(RequestAccountResolver.GetRecursableProperties(owner)
                    .Select(property => RequestAccountResolver.UnwrapNullable(property.PropertyType)));
            }

            frontier = next;
        }

        return false;
    }

    private static bool HasOwnWireKey(Type type)
        => type.GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(property => RequestAccountResolver.IsReadable(property))
            .Any(IsWireKey);

    // A non-nullable AccountId is the scope itself, enforced by AccountScopeBehavior; a nullable one
    // can be omitted and so names any account or none, which is a key like the others.
    private static bool IsWireKey(PropertyInfo property)
    {
        var type = RequestAccountResolver.UnwrapNullable(property.PropertyType);
        if (string.Equals(property.Name, "AccountId", StringComparison.OrdinalIgnoreCase) && type == typeof(Guid))
        {
            return property.PropertyType != typeof(Guid);
        }

        if (type == typeof(Guid) || type == typeof(long))
        {
            return true;
        }

        // *TypeId and TimeZoneId name platform catalog codes, not tenant entities.
        if ((type == typeof(int) || type == typeof(short) || type == typeof(string))
            && property.Name.EndsWith("Id", StringComparison.Ordinal)
            && !property.Name.EndsWith("TypeId", StringComparison.Ordinal)
            && property.Name != "TimeZoneId")
        {
            return true;
        }

        return type != typeof(string)
            && typeof(IEnumerable).IsAssignableFrom(type)
            && ElementType(type) != typeof(string);
    }

    private static Type? ElementType(Type collection)
    {
        if (collection.IsArray)
        {
            return collection.GetElementType();
        }

        return collection.GetInterfaces().Append(collection)
            .FirstOrDefault(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>))
            ?.GetGenericArguments()[0];
    }
}
