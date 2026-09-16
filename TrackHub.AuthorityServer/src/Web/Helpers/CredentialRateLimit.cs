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

using Microsoft.Extensions.Configuration;

namespace TrackHub.AuthorityServer.Web.Helpers;

/// <summary>
/// Per-IP throttle for the endpoints that accept credentials.
/// <para>
/// The per-user lockout counts failures against ONE account, so it does nothing against spraying a
/// single password across many addresses. The limit is per remote address and deliberately
/// generous: the portal's silent token refresh shares the token endpoint, so it must not throttle
/// an office behind one NAT.
/// </para>
/// </summary>
public static class CredentialRateLimit
{
    public const string Policy = "credential-endpoints";

    public const int DefaultPerMinute = 60;

    // Configurable because one value cannot fit every deployment: a large office behind a single
    // NAT and a test environment that mints a session per case both sit legitimately above the
    // default, and a hard-coded ceiling leaves an operator no answer but to drop the control.
    public static int PerMinute(IConfiguration configuration)
        => Math.Max(1, configuration.GetValue<int?>("AuthorityServer:CredentialRateLimitPerMinute") ?? DefaultPerMinute);
}
