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

using Ardalis.GuardClauses;
using Common.Application;
using Common.Web.Infrastructure;
using Microsoft.AspNetCore.HttpOverrides;
using System.Reflection;
using TrackHub.Manager.Infrastructure;
using Common.Web.BackgroundJobs;
using TrackHub.Manager.Application.BackgroundJobs;
using TrackHub.Manager.Web.Endpoints;
using TrackHub.Manager.Web.GraphQL.Mutation;
using TrackHub.Manager.Web.GraphQL.Query;
using Common.Domain.Time;
using TrackHub.Manager.Infrastructure.ManagerDB.Readers;

var builder = WebApplication.CreateBuilder(args);

builder.AddTrackHubSerilog();

var allowedCORSOrigins = builder.Configuration.GetAllowedCorsOrigins();
Guard.Against.NullOrEmpty(allowedCORSOrigins, message: $"Allowed Origins configuration for CORS not loaded");

// Add services to the container.
builder.Services.AddApplicationServices();
builder.Services.AddApplicationDbContext(builder.Configuration);
builder.Services.AddInfrastructureServices(builder.Configuration);
// Manager owns the accounts table: its calendar lookups read it directly instead of calling itself
// over GraphQL. Registered after the shared infrastructure so this one wins.
builder.Services.AddScoped<IAccountTimeZoneResolver, AccountTimeZoneResolver>();
builder.Services.AddAppSecurityContext();
builder.Services.AddAppRouterContext(builder.Configuration);
builder.Services.AddWebServices();

// Scheduled background jobs. Each job owns its cadence and its policy in the Application layer; the
// shared host owns the loop, the failure backoff and the logging.
builder.Services.AddScheduledJob<TrialExpirationJob>();
builder.Services.AddScheduledJob<DocumentScanJob>();
builder.Services.AddScheduledJob<DocumentExpirationJob>();
builder.Services.AddScheduledJob<DocumentRetentionCleanupJob>();
builder.Services.AddScheduledJob<WorkforceExpirationJob>();
builder.Services.AddScheduledJob<NotificationDispatchJob>();
builder.Services.AddScheduledJob<AlertEvaluationJob>();
builder.Services.AddScheduledJob<NotificationDigestJob>();

// Add HealthChecks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>();

builder.Services.AddTrackHubGraphQLServer<Query, Mutation>(builder.Environment.IsDevelopment());

// Anonymous platform-status announcements endpoint (spec 28 ST-09): named policies, applied per
// endpoint so nothing else in the pipeline changes behavior.
builder.Services.AddOutputCache(options =>
    options.AddPolicy(PlatformStatus.CachePolicy, policy => policy.Expire(TimeSpan.FromSeconds(60))));

// Partitioned PER CLIENT IP, not a single global bucket: one shared 60/minute budget across every
// caller means the endpoint starts rejecting once a few dozen portal sessions poll it — i.e. it
// would fail hardest during the incident it exists to report. The partitioning lives in Common.Web
// so this and TripManagement's public trip links cannot drift apart; it also requires
// UseForwardedHeaders (below) to see the real client rather than nginx.
builder.Services.AddAnonymousEndpointRateLimiter(
    PlatformStatus.RateLimitPolicy, permitLimit: 60, window: TimeSpan.FromMinutes(1));

builder.Services.AddCors(options => options
    .AddPolicy("AllowFrontend",
        builder => builder
                    .WithOrigins(allowedCORSOrigins)
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials()));

// Configure HSTS
builder.Services.AddHsts(options =>
{
    options.MaxAge = TimeSpan.FromDays(365 * 2);
    options.IncludeSubDomains = true;
    options.Preload = true;
});

var app = builder.Build();

// Behind nginx every request otherwise appears to come from the proxy's container IP, which would
// collapse the per-IP rate-limit partition above into a single shared bucket. Mirrors the
// AuthorityServer configuration.
var forwardedHeadersOptions = TrustedProxies.Create(builder.Configuration);
app.UseForwardedHeaders(forwardedHeadersOptions);

app.UseHeaderPropagation();

// Enable CORS
app.UseCors("AllowFrontend");

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHealthChecks("/health");
app.UseHttpsRedirection();
app.UseStaticFiles();

// Explicit: WebApplication would auto-insert these, but authentication must not depend on
// pipeline inference.
app.UseAuthentication();
app.UseAuthorization();

app.UseExceptionHandler(options => { });

app.UseRateLimiter();
app.UseOutputCache();

app.MapEndpoints(Assembly.GetExecutingAssembly());
app.MapGraphQL().RequireAuthorization();

app.Run();
