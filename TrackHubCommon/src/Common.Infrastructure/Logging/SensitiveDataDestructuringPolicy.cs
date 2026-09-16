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

using System.Collections.Concurrent;
using System.Reflection;
using Serilog.Core;
using Serilog.Events;

namespace Common.Infrastructure.Logging;

/// <summary>
/// Redacts credential-bearing members from any TrackHub type written to a log with the
/// destructuring operator. Structured log properties are persisted verbatim by the PostgreSQL
/// sink, so a single <c>{@Payload}</c> on a request carrying a password would place live
/// credentials in the logs table.
/// </summary>
public sealed class SensitiveDataDestructuringPolicy : IDestructuringPolicy
{
    public const string RedactedValue = "***redacted***";

    private static readonly string[] SensitiveFragments =
        ["password", "secret", "token", "credential", "passphrase", "apikey", "privatekey"];

    // Provider credential material is stored in members named exactly Key/Key2, which no
    // fragment can match without also redacting FeatureKey, IdempotencyKey and their kin.
    private static readonly string[] SensitiveNames = ["key", "key2", "pwd", "pass"];

    private static readonly ConcurrentDictionary<Type, PropertyInfo[]> PropertyCache = new();

    public bool TryDestructure(object value, ILogEventPropertyValueFactory propertyValueFactory, out LogEventPropertyValue result)
    {
        ArgumentNullException.ThrowIfNull(propertyValueFactory);

        var type = value?.GetType();
        if (type is null || !IsTrackHubType(type))
        {
            result = null!;
            return false;
        }

        var properties = PropertyCache.GetOrAdd(type, static t => [.. t
            .GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(p => p.CanRead && p.GetIndexParameters().Length == 0)]);

        var logged = new List<LogEventProperty>(properties.Length);
        foreach (var property in properties)
        {
            if (IsSensitive(property.Name))
            {
                logged.Add(new LogEventProperty(property.Name, new ScalarValue(RedactedValue)));
                continue;
            }

            object? memberValue;
            try
            {
                memberValue = property.GetValue(value);
            }
            catch (TargetInvocationException)
            {
                continue;
            }

            logged.Add(new LogEventProperty(property.Name, propertyValueFactory.CreatePropertyValue(memberValue, destructureObjects: true)));
        }

        result = new StructureValue(logged, type.Name);
        return true;
    }

    public static bool IsSensitive(string memberName)
    {
        ArgumentNullException.ThrowIfNull(memberName);

        foreach (var name in SensitiveNames)
        {
            if (memberName.Equals(name, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        foreach (var fragment in SensitiveFragments)
        {
            if (memberName.Contains(fragment, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }

    private static bool IsTrackHubType(Type type)
    {
        var assembly = type.Assembly.GetName().Name;
        return assembly is not null
            && (assembly.StartsWith("TrackHub", StringComparison.Ordinal)
                || assembly.StartsWith("Common.", StringComparison.Ordinal));
    }
}
