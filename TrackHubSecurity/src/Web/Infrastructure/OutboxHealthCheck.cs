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

using Microsoft.Extensions.Diagnostics.HealthChecks;
using TrackHub.Security.Domain.Interfaces;

namespace TrackHub.Security.Web.Infrastructure;

// Degraded, not Unhealthy: Security keeps serving, but Manager is out of step until the rows are replayed.
public sealed class OutboxHealthCheck(IOutboxReader reader) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var failed = await reader.CountFailedAsync(cancellationToken);
        return failed == 0
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Degraded($"{failed} Manager-sync outbox message(s) exhausted their attempts; replay them with replayFailedOutboxMessages, or discard the ones Manager will always refuse.");
    }
}
