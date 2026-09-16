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

using Common.Application.BackgroundJobs;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Common.Web.BackgroundJobs;

/// <summary>
/// Drives one <see cref="IScheduledJob"/>: startup delay, a scope per cycle, and an exponential
/// backoff after consecutive failures. A broken dependency otherwise produces an error every cycle
/// around the clock — plus the downstream chatter each attempt causes.
/// </summary>
public sealed class ScheduledJobHost<TJob>(
    IServiceScopeFactory scopeFactory,
    ILogger<ScheduledJobHost<TJob>> logger) : BackgroundService
    where TJob : class, IScheduledJob
{
    private static readonly TimeSpan MaxFailureBackoff = TimeSpan.FromMinutes(15);
    private const int FailuresLoggedAtError = 3;
    private static readonly string JobName = typeof(TJob).Name;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!await DelayAsync(TJob.StartupDelay, stoppingToken))
        {
            return;
        }

        var consecutiveFailures = 0;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                await scope.ServiceProvider.GetRequiredService<TJob>()
                    .RunOnceAsync(DateTimeOffset.UtcNow, stoppingToken);

                if (consecutiveFailures > 0)
                {
                    logger.LogInformation("{Job} recovered after {Failures} failed cycle(s).", JobName, consecutiveFailures);
                }
                consecutiveFailures = 0;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception ex)
            {
                consecutiveFailures++;
                // The first failures are an incident; a persistent one is an environment problem, and
                // logging it at Error every cycle floods the log store without adding information.
                if (consecutiveFailures <= FailuresLoggedAtError)
                {
                    logger.LogError(ex, "{Job} cycle failed ({Failures} consecutive).", JobName, consecutiveFailures);
                }
                else
                {
                    logger.LogWarning("{Job} cycle failed ({Failures} consecutive): {Error}", JobName, consecutiveFailures, ex.Message);
                }
            }

            if (!await DelayAsync(NextDelay(consecutiveFailures), stoppingToken))
            {
                return;
            }
        }
    }

    /// <summary>
    /// Doubles the interval per consecutive failure, capped at 15 minutes OR the job's own interval,
    /// whichever is longer: a daily job that fails must wait until tomorrow, not retry every quarter hour.
    /// </summary>
    internal static TimeSpan NextDelay(int consecutiveFailures)
    {
        if (consecutiveFailures == 0)
        {
            return TJob.Interval;
        }

        var cap = TJob.Interval > MaxFailureBackoff ? TJob.Interval : MaxFailureBackoff;
        var backoff = TimeSpan.FromSeconds(TJob.Interval.TotalSeconds * Math.Pow(2, Math.Min(consecutiveFailures, 5)));
        return backoff < cap ? backoff : cap;
    }

    private static async Task<bool> DelayAsync(TimeSpan delay, CancellationToken stoppingToken)
    {
        try
        {
            await Task.Delay(delay, stoppingToken);
            return true;
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }
}
