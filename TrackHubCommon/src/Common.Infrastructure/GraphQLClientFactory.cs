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
using GraphQL.Client.Abstractions;
using GraphQL.Client.Http;
using GraphQL.Client.Serializer.SystemTextJson;
using Microsoft.Extensions.Configuration;
using Common.Application.Interfaces;

namespace Common.Infrastructure;

/// <summary>
/// Builds the typed <see cref="IGraphQLClient"/> for a named inter-service endpoint. Building one
/// is pure: authentication is attached per request by <see cref="ClientCredentialsTokenHandler"/> on
/// the named HttpClient, so constructing a client — which every client class does in its own
/// constructor, and therefore during DI resolution — performs no network I/O.
/// </summary>
public sealed class GraphQLClientFactory(
    IHttpClientFactory httpClientFactory,
    IConfiguration configuration,
    IClientCredentialsTokenProvider tokens) : IGraphQLClientFactory
{
    public IGraphQLClient CreateClient(string name) => CreateClient(name, asService: false);

    /// <summary>
    /// When <paramref name="asService"/> is true the <c>{name}AsService</c> HttpClient is used: it
    /// does not propagate the caller's headers, so its token handler supplies the host's own
    /// identity instead of the caller's.
    /// </summary>
    public IGraphQLClient CreateClient(string name, bool asService)
    {
        var httpClient = httpClientFactory.CreateClient(asService ? $"{name}AsService" : name);

        var url = configuration.GetValue<string>($"AppSettings:GraphQL{name}Service");
        Guard.Against.Null(url, message: $"Setting 'GraphQL{name}Service' not found.");

        var options = new GraphQLHttpClientOptions { EndPoint = new Uri(url) };
        return new GraphQLHttpClient(options, new SystemTextJsonSerializer(), httpClient);
    }

    /// <summary>
    /// The rare outbound call that is not GraphQL still needs the same token on a plain HttpClient;
    /// exposing it here is what stops a second, uncached token dance being written beside it.
    /// </summary>
    public Task<string?> GetClientCredentialsTokenAsync() => tokens.GetTokenAsync();
}
