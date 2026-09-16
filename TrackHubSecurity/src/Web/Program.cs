// Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

using Common.Web.Infrastructure;
using Ardalis.GuardClauses;
using Microsoft.AspNetCore.HttpOverrides;
using TrackHub.Security.Infrastructure;
using TrackHub.Security.Web.BackgroundServices;
using TrackHub.Security.Web.GraphQL.Mutation;
using TrackHub.Security.Web.GraphQL.Query;

var builder = WebApplication.CreateBuilder(args);

builder.AddTrackHubSerilog();

var allowedCORSOrigins = builder.Configuration.GetAllowedCorsOrigins();
Guard.Against.NullOrEmpty(allowedCORSOrigins, message: $"Allowed Origins configuration for CORS not loaded");

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    // The anonymous activation endpoint rate-limits per client IP, so the forwarded address has to
    // be honoured — but only from the deployment's own proxy network. ASP.NET's own default (trust
    // loopback only) would leave every request carrying nginx's container IP and collapse those
    // partitions into one bucket.
    var trusted = TrustedProxies.Create(builder.Configuration);
    options.ForwardedHeaders = ForwardedHeaders.All;
    options.ForwardLimit = trusted.ForwardLimit;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
    foreach (var network in trusted.KnownIPNetworks)
    {
        options.KnownIPNetworks.Add(network);
    }
});

// Add services to the container.
builder.Services.AddApplicationServices();
builder.Services.AddApplicationDbContext(builder.Configuration);
builder.Services.AddAppManagerContext();
builder.Services.AddInfrastructureServices(builder.Configuration, false);
builder.Services.AddWebServices();

// Add HealthChecks
builder.Services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>();

builder.Services.AddTrackHubGraphQLServer<Query, Mutation>(builder.Environment.IsDevelopment());

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

// Drains the cross-service outbox (the user mirror and audit forwarding Security owes Manager).
builder.Services.AddHostedService<OutboxDispatchService>();

var app = builder.Build();

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

app.MapGraphQL().RequireAuthorization();

app.Run();
