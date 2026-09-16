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

using Common.Mediator;
using TrackHub.Router.Application.DevicePositions.Commands.Sync;
using TrackHub.Router.Domain.Interfaces;

namespace TrackHub.Router.Web.BackgroundServices;

/// <summary>Runs the manual syncs the trigger accepted, one at a time, off the request thread.</summary>
public sealed class SyncDispatchService(
    ISyncDispatchQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<SyncDispatchService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var request in queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                await scope.ServiceProvider.GetRequiredService<ISender>().Send(
                    new SyncOperatorDevicesCommand(
                        request.Operator,
                        request.TriggerType,
                        request.CorrelationId,
                        request.ResetDeviceCatalog,
                        request.AutoAssignNewDevices),
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { return; }
            catch (Exception exception)
            {
                // The run itself is recorded by the sync pipeline; this is the transport-level net.
                logger.LogError(exception,
                    "Queued manual sync for operator {OperatorId} failed. Correlation {CorrelationId}.",
                    request.Operator.OperatorId, request.CorrelationId);
            }
        }
    }
}
