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
using Common.Infrastructure;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Http.Resilience;
using Polly;

namespace Microsoft.Extensions.DependencyInjection;

/// <summary>
/// GraphQL always travels as POST, so method-based idempotency detection cannot tell queries from
/// mutations: clients that carry mutations must not retry.
/// </summary>
public enum GraphQLClientResilience
{
    None,

    /// <summary>Timeout + circuit breaker, no retries; the safe default for clients that carry mutations.</summary>
    NoRetry,

    /// <summary>Full standard pipeline including retries; only for query-only clients.</summary>
    WithRetry
}

/// <summary>
/// Single registration point for inter-service GraphQL HttpClients: same timeout, Authorization and
/// x-correlation-id propagation, and an explicit resilience choice.
/// </summary>
public static class GraphQLClientServiceCollectionExtensions
{
    // Marker so header-propagation options are configured once per host even when several
    // Infrastructure projects register clients.
    private sealed class TrackHubHeaderPropagationConfigured { }

    // One definition per client name: a second registration would stack another handler chain on the
    // same HttpClient (retries multiplying per call), so repeats must match the first or fail.
    private sealed record GraphQLClientDefinition(bool PropagateHeaders, GraphQLClientResilience Resilience, int TimeoutSeconds);

    private sealed class GraphQLClientDefinitions : Dictionary<string, GraphQLClientDefinition>;

    public static IHttpClientBuilder AddGraphQLClient(
        this IServiceCollection services,
        string name,
        bool propagateHeaders = true,
        GraphQLClientResilience resilience = GraphQLClientResilience.NoRetry,
        int timeoutSeconds = 30)
    {
        var definitions = services.FirstOrDefault(d => d.ServiceType == typeof(GraphQLClientDefinitions))?.ImplementationInstance as GraphQLClientDefinitions;
        if (definitions is null)
        {
            definitions = [];
            services.AddSingleton(definitions);
        }

        var definition = new GraphQLClientDefinition(propagateHeaders, resilience, timeoutSeconds);
        if (definitions.TryGetValue(name, out var existing))
        {
            if (existing != definition)
            {
                throw new InvalidOperationException($"GraphQL client '{name}' is registered twice with different settings ({existing} and {definition}).");
            }

            return services.AddHttpClient(name);
        }

        definitions.Add(name, definition);

        if (propagateHeaders)
        {
            services.AddTrackHubHeaderPropagation();
        }

        // Only load-bearing on the None path: AddStandardResilienceHandler replaces it with InfiniteTimeSpan,
        // which is why the pipeline timeouts must be configured (ApplyTimeout).
        var builder = services.AddHttpClient(name,
            client => client.Timeout = TimeSpan.FromSeconds(timeoutSeconds));

        if (propagateHeaders)
        {
            builder.AddHeaderPropagation();
        }

        // A client that does not propagate the caller's headers has no caller to speak for (the AsService
        // twins, worker hosts), so it gets the host identity; on a propagating client the handler is inert.
        services.AddClientCredentialsTokenProvider();
        builder.AddHttpMessageHandler(sp => new ClientCredentialsTokenHandler(
            sp.GetRequiredService<IClientCredentialsTokenProvider>(),
            useServiceIdentity: !propagateHeaders));

        switch (resilience)
        {
            case GraphQLClientResilience.NoRetry:
                builder.AddStandardResilienceHandler(options =>
                {
                    options.Retry.ShouldHandle = static _ => PredicateResult.False();
                    ApplyTimeout(options, timeoutSeconds);
                });
                break;
            case GraphQLClientResilience.WithRetry:
                builder.AddStandardResilienceHandler(options => ApplyTimeout(options, timeoutSeconds));
                break;
        }

        return builder;
    }

    /// <summary>
    /// Without this, the standard handler's 10 s per-attempt and 30 s total defaults fire before
    /// <c>HttpClient.Timeout</c> and silently override the declared timeout. The library validates the
    /// values against each other: total must exceed one attempt, and the breaker window must cover two.
    /// </summary>
    private static void ApplyTimeout(HttpStandardResilienceOptions options, int timeoutSeconds)
    {
        var attempt = TimeSpan.FromSeconds(timeoutSeconds);
        options.AttemptTimeout.Timeout = attempt;
        options.TotalRequestTimeout.Timeout = TotalFor(timeoutSeconds);
        options.CircuitBreaker.SamplingDuration = attempt * 2;
    }

    /// <summary>
    /// `timeoutSeconds` is the budget for one attempt; the total leaves room for the retry path's extra attempts.
    /// </summary>
    private static TimeSpan TotalFor(int timeoutSeconds) => TimeSpan.FromSeconds(timeoutSeconds * 3);

    /// <summary>
    /// The '{name}AsService' twin: no user-token propagation; the factory attaches the host's identity.
    /// </summary>
    public static IHttpClientBuilder AddGraphQLServiceClient(
        this IServiceCollection services,
        string name,
        GraphQLClientResilience resilience = GraphQLClientResilience.NoRetry,
        int timeoutSeconds = 30)
        => services.AddGraphQLClient($"{name}AsService", propagateHeaders: false, resilience, timeoutSeconds);

    public static IServiceCollection AddClientCredentialsTokenProvider(this IServiceCollection services)
    {
        if (!services.Any(d => d.ServiceType == typeof(IClientCredentialsTokenProvider)))
        {
            services.AddSingleton<IClientCredentialsTokenProvider, ClientCredentialsTokenProvider>();
            services.AddHttpClient(ClientCredentialsTokenProvider.HttpClientName,
                client => client.Timeout = ClientCredentialsTokenProvider.RequestTimeout);
        }

        return services;
    }

    /// <summary>
    /// Propagates Authorization and x-correlation-id; idempotent across a host's Infrastructure registrations.
    /// </summary>
    public static IServiceCollection AddTrackHubHeaderPropagation(this IServiceCollection services)
    {
        if (!services.Any(d => d.ServiceType == typeof(TrackHubHeaderPropagationConfigured)))
        {
            services.AddSingleton<TrackHubHeaderPropagationConfigured>();
            services.AddHeaderPropagation(options =>
            {
                options.Headers.Add("Authorization");
                options.Headers.Add("x-correlation-id");
            });
        }

        return services;
    }
}
