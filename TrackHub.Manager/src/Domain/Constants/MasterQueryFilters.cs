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

namespace TrackHub.Manager.Domain.Constants;

/// <summary>
/// The columns each master list surface may be filtered on. A filter key reaches
/// <c>Expression.Property</c>, so anything outside these sets would let a caller query the
/// entity on columns its projection never returns.
/// </summary>
public static class MasterQueryFilters
{
    public static readonly IReadOnlySet<string> Operators =
        new HashSet<string>(StringComparer.Ordinal) { "OperatorId", "AccountId", "Enabled", "ProtocolType" };

    public static readonly IReadOnlySet<string> AccountSettings =
        new HashSet<string>(StringComparer.Ordinal) { "AccountId" };

    public static readonly IReadOnlySet<string> DeviceTransporters =
        new HashSet<string>(StringComparer.Ordinal) { "AccountId", "TransporterId", "DeviceId" };
}
