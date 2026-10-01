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
using TrackHub.Security.Application.Outbox;

namespace TrackHub.Security.Web.BackgroundServices;

/// <summary>
/// Drains the cross-service outbox every 30 s. The work itself is <see cref="OutboxDispatcher"/> in
/// the Application layer, where it can be unit-tested.
/// </summary>
public sealed class OutboxDispatchJob(OutboxDispatcher dispatcher) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromSeconds(30);

    public static TimeSpan StartupDelay => TimeSpan.FromSeconds(10);

    public Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
        => dispatcher.DispatchDueAsync(cancellationToken);
}
