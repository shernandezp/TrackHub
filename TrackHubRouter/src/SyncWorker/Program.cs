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

using Common.Application;
using Common.Web.BackgroundJobs;
using TrackHub.Router.SyncWorker;

var builder = Host.CreateApplicationBuilder(args);

builder.AddTrackHubSerilog();

// Add services to the container.
builder.Services.AddApplicationServices();
builder.Services.AddAppManagerContext(false);
builder.Services.AddAppTelemetryContext(false);
builder.Services.AddGeofenceManagerContext(false);
builder.Services.AddAppTripManagementContext(false);
builder.Services.AddCommonContext(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddWorkerServices();

builder.Services.AddScoped<OperatorFanOut>();
builder.Services.AddScheduledJob<PositionSyncJob>();
builder.Services.AddScheduledJob<DeviceSyncJob>();
builder.Services.AddScheduledJob<OperatorHealthJob>();
builder.Services.AddScheduledJob<WorkerHeartbeatJob>();

var host = builder.Build();
host.Run();
