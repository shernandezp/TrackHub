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
using Common.Domain.Constants;
using Common.Mediator;
using TrackHub.Router.Application.DevicePositions.Commands.Health;
using TrackHub.Router.Application.DevicePositions.Commands.Sync;
using TrackHub.Router.Domain.Interfaces.Manager;

namespace TrackHub.Router.SyncWorker;

public sealed class PositionSyncJob(ISender sender) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromSeconds(10);

    public static TimeSpan StartupDelay => TimeSpan.FromSeconds(5);

    public Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
        => sender.Send(new SyncPositionCommand(), cancellationToken);
}

public sealed class DeviceSyncJob(OperatorFanOut fanOut) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromMinutes(1);

    public static TimeSpan StartupDelay => TimeSpan.FromSeconds(15);

    public Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
        => fanOut.RunAsync(
            "device-sync",
            now,
            (op, at) => at - (op.LastDeviceSyncAt ?? DateTimeOffset.MinValue) >= TimeSpan.FromMinutes(Math.Max(1, op.SyncIntervalMinutes)),
            (sender, op, token) => sender.Send(new SyncOperatorDevicesCommand(op, "AUTOMATIC"), token),
            cancellationToken);
}

// Operator health monitoring is core behavior for every account with provider integration; it is
// not a separately billed feature.
public sealed class OperatorHealthJob(OperatorFanOut fanOut) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromMinutes(1);

    public static TimeSpan StartupDelay => TimeSpan.FromSeconds(20);

    public Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
        => fanOut.RunAsync(
            "operator-health",
            now,
            (op, at) => at - (op.LastHealthCheckAt ?? DateTimeOffset.MinValue) >= Interval,
            (sender, op, token) => sender.Send(new RecordOperatorHealthCommand(op), token),
            cancellationToken);
}

// The worker is a separate process with no HTTP surface: this per-cycle job run is the only evidence
// that it is alive.
public sealed class WorkerHeartbeatJob(IBackgroundJobRunRecorder recorder) : IScheduledJob
{
    public static TimeSpan Interval => TimeSpan.FromMinutes(5);

    public static TimeSpan StartupDelay => TimeSpan.FromSeconds(5);

    public Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken)
        => recorder.RecordAsync(
            BackgroundJobKeys.RouterSyncWorkerHeartbeat,
            $"{BackgroundJobKeys.RouterSyncWorkerHeartbeat}:{now:yyyyMMddHHmmss}",
            "Succeeded",
            now,
            DateTimeOffset.UtcNow,
            null,
            cancellationToken);
}
