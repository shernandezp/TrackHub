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

using Common.Infrastructure.Logging;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;

namespace Microsoft.Extensions.DependencyInjection;

/// <summary>
/// Reads sinks, levels and enrichers from the <c>Serilog</c> configuration section, then applies the
/// platform-wide source overrides every service needs.
/// </summary>
public static class SerilogServiceCollectionExtensions
{
    public static TBuilder AddTrackHubSerilog<TBuilder>(this TBuilder builder)
        where TBuilder : IHostApplicationBuilder
    {
        ArgumentNullException.ThrowIfNull(builder);

        builder.Services.AddSerilog((services, configuration) => configuration
            .ReadFrom.Configuration(builder.Configuration)
            .ReadFrom.Services(services)
            // Polly resilience telemetry logs an Information event per call, flooding the logs table; cap it at
            // Warning after ReadFrom so it wins. Retries exhausted and circuit opened still flow through.
            .MinimumLevel.Override("Polly", LogEventLevel.Warning)
            // Redacts credential-bearing members from anything destructured into a log event.
            .Destructure.With<SensitiveDataDestructuringPolicy>()
            .Enrich.FromLogContext()
            .Enrich.WithMachineName()
            .Enrich.WithEnvironmentName()
            .Enrich.WithProperty("Application", builder.Environment.ApplicationName));

        return builder;
    }
}
