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

namespace Common.Application.BackgroundJobs;

/// <summary>
/// A unit of recurring background work. Implementations live in a service's Application layer and
/// take ports, not a DbContext, so their policy is unit-testable; the cadence, the failure backoff
/// and the failure logging belong to the host that drives them, not to each job.
/// </summary>
public interface IScheduledJob
{
    static abstract TimeSpan Interval { get; }

    /// <summary>Delay before the first cycle, so a cold start is not competing with request traffic.</summary>
    static abstract TimeSpan StartupDelay { get; }

    Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken);
}
