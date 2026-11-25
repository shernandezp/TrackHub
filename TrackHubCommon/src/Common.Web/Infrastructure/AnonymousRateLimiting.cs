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

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

namespace Microsoft.Extensions.DependencyInjection;

/// <summary>
/// Rate limiting for anonymous HTTP endpoints, which <c>RateLimitingBehavior</c> leaves unlimited because
/// it partitions on the authenticated caller. Partitioned per client IP, never one global bucket, so a
/// single caller cannot exhaust everyone's budget. Requires <c>UseForwardedHeaders</c> behind the proxy,
/// or every request appears to come from the proxy and all partitions collapse into one.
/// </summary>
public static class AnonymousRateLimiting
{
    /// <summary>
    /// Registers a named fixed-window policy partitioned by client IP with 429 rejections. Call once per
    /// policy; <c>AddRateLimiter</c> is additive.
    /// </summary>
    /// <param name="policyName">Referenced from the endpoint's <c>RequireRateLimiting</c>.</param>
    /// <param name="permitLimit">Requests allowed per window, per client IP.</param>
    public static IServiceCollection AddAnonymousEndpointRateLimiter(
        this IServiceCollection services,
        string policyName,
        int permitLimit,
        TimeSpan window)
        => services.AddRateLimiter(options =>
        {
            // The default rejection status is 503, which signals an unhealthy server and invites the retry
            // storm the limiter exists to stop; 429 is the accurate answer.
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy(policyName, httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = permitLimit,
                        Window = window,
                        QueueLimit = 0,
                    }));
        });
}
