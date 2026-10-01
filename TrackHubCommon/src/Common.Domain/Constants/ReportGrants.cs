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

namespace Common.Domain.Constants;

// The "Resource/Action" grants a report's feeds need, stored comma-separated on the catalog row.
public static class ReportGrants
{
    public static string Format(string resource, string action) => $"{resource}/{action}";

    public static IReadOnlyList<(string Resource, string Action)> Parse(string? grants)
        => string.IsNullOrWhiteSpace(grants)
            ? []
            : [.. grants.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(grant => grant.Split('/', 2))
                .Where(parts => parts.Length == 2)
                .Select(parts => (parts[0], parts[1]))];
}
