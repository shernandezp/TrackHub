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

using Common.Domain.Constants;
using Common.Mediator;
using TrackHub.Router.Application.DevicePositions.Commands.Health;
using TrackHub.Router.Application.DevicePositions.Commands.Sync;
using TrackHub.Router.Domain.Interfaces;
using TrackHub.Router.Application.Sync;
using TrackHub.Router.Domain.Interfaces.Manager;
using TrackHub.Router.Domain.Models;

namespace TrackHub.Router.SyncWorker;

public class Worker(ILogger<Worker> logger, IServiceProvider serviceProvider) : BackgroundService
{
    private static readonly TimeSpan PositionInterval = TimeSpan.FromSeconds(10);
    private static readonly TimeSpan DeviceSyncCheckInterval = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan HealthCheckInterval = TimeSpan.FromMinutes(1);

    // The worker is a separate process with no HTTP surface: this per-cycle job run is the only
    // evidence that it is alive.
    private static readonly TimeSpan HeartbeatInterval = TimeSpan.FromMinutes(5);

    private readonly ILogger<Worker> _logger = logger;
    private readonly IServiceProvider _serviceProvider = serviceProvider;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var positionLoop = RunLoopAsync("position-sync", PositionInterval, RunPositionSyncAsync, stoppingToken);
        var deviceLoop = RunLoopAsync("device-sync", DeviceSyncCheckInterval, RunDeviceSyncAsync, stoppingToken);
        var healthLoop = RunLoopAsync("operator-health", HealthCheckInterval, RunHealthCheckAsync, stoppingToken);

        var heartbeatLoop = RunLoopAsync("heartbeat", HeartbeatInterval, RunHeartbeatAsync, stoppingToken);

        await Task.WhenAll(positionLoop, deviceLoop, healthLoop, heartbeatLoop);
    }

    private async Task RunLoopAsync(string name, TimeSpan interval, Func<CancellationToken, Task> action, CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogDebug("Worker loop {Loop} tick at {Time}.", name, DateTimeOffset.UtcNow);
                await action(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Worker loop {Loop} iteration failed.", name);
            }

            try
            {
                await Task.Delay(interval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task RunHeartbeatAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var recorder = scope.ServiceProvider.GetRequiredService<IBackgroundJobRunRecorder>();
        var now = DateTimeOffset.UtcNow;

        await recorder.RecordAsync(
            BackgroundJobKeys.RouterSyncWorkerHeartbeat,
            $"{BackgroundJobKeys.RouterSyncWorkerHeartbeat}:{now:yyyyMMddHHmmss}",
            "Succeeded",
            now,
            DateTimeOffset.UtcNow,
            null,
            stoppingToken);
    }

    private async Task RunPositionSyncAsync(CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var sender = scope.ServiceProvider.GetRequiredService<ISender>();
        await sender.Send(new SyncPositionCommand(), stoppingToken);
    }

    private Task RunDeviceSyncAsync(CancellationToken stoppingToken)
        => RunOperatorLoopAsync(
            "device-sync",
            (op, now) => now - (op.LastDeviceSyncAt ?? DateTimeOffset.MinValue) >= TimeSpan.FromMinutes(Math.Max(1, op.SyncIntervalMinutes)),
            (sender, op, token) => sender.Send(new SyncOperatorDevicesCommand(op, "AUTOMATIC"), token),
            stoppingToken);

    // Operator health monitoring is core behavior for every account with provider integration
    // running in the background; it is not a separately billed feature.
    private Task RunHealthCheckAsync(CancellationToken stoppingToken)
        => RunOperatorLoopAsync(
            "operator-health",
            (op, now) => now - (op.LastHealthCheckAt ?? DateTimeOffset.MinValue) >= HealthCheckInterval,
            (sender, op, token) => sender.Send(new RecordOperatorHealthCommand(op), token),
            stoppingToken);

    /// <summary>
    /// Walks every GPS-enabled account and dispatches the due operators. Accounts run concurrently
    /// and every operator draws from one shared gate: sequentially, a single unreachable provider
    /// held the whole platform's cadence for its 30 s timeout, one operator at a time, so healthy
    /// accounts missed their cycle entirely.
    /// </summary>
    private async Task RunOperatorLoopAsync(
        string loopName,
        Func<OperatorVm, DateTimeOffset, bool> isDue,
        Func<ISender, OperatorVm, CancellationToken, Task<bool>> dispatch,
        CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var accountReader = scope.ServiceProvider.GetRequiredService<IAccountReader>();
        var operatorReader = scope.ServiceProvider.GetRequiredService<IOperatorReader>();
        var backoff = scope.ServiceProvider.GetRequiredService<IOperatorSyncBackoff>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        var accounts = await accountReader.GetAccountsToSyncAsync(stoppingToken);
        var now = DateTimeOffset.UtcNow;

        using var gate = new SemaphoreSlim(OperatorSyncConcurrency.Resolve(configuration));
        await Task.WhenAll(accounts
            .Where(account => account.GpsIntegrationEnabled)
            .Select(account => ProcessAccountOperatorsAsync(
                loopName, account.AccountId, operatorReader, backoff, gate, now, isDue, dispatch, stoppingToken)));
    }

    private async Task ProcessAccountOperatorsAsync(
        string loopName,
        Guid accountId,
        IOperatorReader operatorReader,
        IOperatorSyncBackoff backoff,
        SemaphoreSlim gate,
        DateTimeOffset now,
        Func<OperatorVm, DateTimeOffset, bool> isDue,
        Func<ISender, OperatorVm, CancellationToken, Task<bool>> dispatch,
        CancellationToken stoppingToken)
    {
        IEnumerable<OperatorVm> operators;
        try
        {
            operators = await operatorReader.GetOperatorsByAccountsAsync(accountId, stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Loop {Loop} failed to load operators for account {AccountId}.", loopName, accountId);
            return;
        }

        var due = operators
            // The master projection already carries the credential under the worker's service
            // identity, and gating on the persisted timestamp keeps horizontally-scaled Router
            // instances from duplicating work. Operators inside their failure backoff window are
            // skipped so a persistently failing provider is not re-attempted at full cadence.
            .Where(op => op.Enabled && op.Credential is not null && isDue(op, now) && !backoff.IsInBackoff(op.OperatorId, now))
            .Select(op => DispatchOperatorAsync(loopName, accountId, op, backoff, gate, dispatch, stoppingToken));
        await Task.WhenAll(due);
    }

    private async Task DispatchOperatorAsync(
        string loopName,
        Guid accountId,
        OperatorVm @operator,
        IOperatorSyncBackoff backoff,
        SemaphoreSlim gate,
        Func<ISender, OperatorVm, CancellationToken, Task<bool>> dispatch,
        CancellationToken stoppingToken)
    {
        await gate.WaitAsync(stoppingToken);
        try
        {
            // A scope per dispatch: the fan-out is concurrent, and a handler's scoped dependencies
            // must not be shared across parallel sends.
            using var scope = _serviceProvider.CreateScope();
            var sender = scope.ServiceProvider.GetRequiredService<ISender>();

            if (await dispatch(sender, @operator, stoppingToken))
            {
                backoff.RecordSuccess(@operator.OperatorId);
            }
            else
            {
                backoff.RecordFailure(@operator.OperatorId, DateTimeOffset.UtcNow);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            backoff.RecordFailure(@operator.OperatorId, DateTimeOffset.UtcNow);
            _logger.LogError(ex, "Loop {Loop} failed for operator {OperatorId} (account {AccountId}).",
                loopName, @operator.OperatorId, accountId);
        }
        finally
        {
            gate.Release();
        }
    }
}
