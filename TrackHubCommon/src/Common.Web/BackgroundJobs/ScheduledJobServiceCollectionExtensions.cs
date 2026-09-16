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

namespace Common.Web.BackgroundJobs;

public static class ScheduledJobServiceCollectionExtensions
{
    /// <summary>Registers the job as scoped and starts the host that runs it on its own cadence.</summary>
    public static IServiceCollection AddScheduledJob<TJob>(this IServiceCollection services)
        where TJob : class, IScheduledJob
    {
        services.AddScoped<TJob>();
        services.AddHostedService<ScheduledJobHost<TJob>>();
        return services;
    }
}
