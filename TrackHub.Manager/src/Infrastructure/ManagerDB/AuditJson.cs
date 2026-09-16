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
using System.Text.Json;

namespace TrackHub.Manager.Infrastructure.ManagerDB;

/// <summary>
/// Serializes a value as a JSON string literal for the hand-built audit payloads.
/// <para>
/// Every audit payload in this service flows through here. Interpolating a caller-supplied value
/// raw lets a tenant close the string and forge neighbouring fields in
/// <c>audit_events.newvaluesjson</c>, or break the row for every downstream consumer with a single
/// stray quote or newline.
/// </para>
/// </summary>
internal static class AuditJson
{
    internal static string Quote(string? value) => value == null ? "null" : JsonSerializer.Serialize(value);

    internal static string Quote(DateTimeOffset? value) => value.HasValue ? Quote(value.Value.ToString("O")) : "null";

    /// <summary>
    /// A number as JSON sees it. Interpolating a double directly formats it in the ambient culture,
    /// and a comma decimal separator turns the payload into something no consumer can parse.
    /// </summary>
    internal static string Number(double value) => value.ToString(CultureInfo.InvariantCulture);
}
