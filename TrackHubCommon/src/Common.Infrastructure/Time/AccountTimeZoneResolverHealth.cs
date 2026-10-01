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

namespace Common.Infrastructure.Time;

// Whether this host can currently read account calendars from Manager. Reported through /health so
// an outage that makes exports and day cut-offs fall back to a stale zone is visible, not silent.
public sealed class AccountTimeZoneResolverHealth
{
    private long lastSuccessTicks;
    private long lastFailureTicks;
    private string? lastFailure;

    public void RecordSuccess() => Interlocked.Exchange(ref lastSuccessTicks, DateTimeOffset.UtcNow.UtcTicks);

    public void RecordFailure(Exception exception)
    {
        lastFailure = exception.Message;
        Interlocked.Exchange(ref lastFailureTicks, DateTimeOffset.UtcNow.UtcTicks);
    }

    public bool IsFailing => Interlocked.Read(ref lastFailureTicks) > Interlocked.Read(ref lastSuccessTicks);

    public string? LastFailure => lastFailure;
}

public sealed class AccountTimeZoneResolverHealthCheck(AccountTimeZoneResolverHealth health) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
        => Task.FromResult(health.IsFailing
            ? HealthCheckResult.Degraded($"Account time zones cannot be read from Manager: {health.LastFailure}")
            : HealthCheckResult.Healthy());
}
