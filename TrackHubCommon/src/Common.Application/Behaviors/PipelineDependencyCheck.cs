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

using Common.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Common.Application.Behaviors;

// The status and feature gates have no fail-open fallback: a host whose pipeline enforces them must
// register the real services, and a missing one stops the host at startup instead of admitting
// every request.
internal sealed class PipelineDependencyCheck(IServiceProviderIsService services, bool requiresFeatureFlags) : IHostedService
{
    public Task StartAsync(CancellationToken cancellationToken)
    {
        Require(typeof(IAccountOperationalStatusService));
        if (requiresFeatureFlags)
        {
            Require(typeof(IFeatureFlagService));
        }

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private void Require(Type serviceType)
    {
        if (!services.IsService(serviceType))
        {
            throw new InvalidOperationException(
                $"{serviceType.Name} is not registered. The request pipeline enforces it and has no default.");
        }
    }
}
