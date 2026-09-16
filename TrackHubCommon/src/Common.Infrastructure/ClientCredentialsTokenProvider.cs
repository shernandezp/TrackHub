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
using Common.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Text.Json;

namespace Common.Infrastructure;

/// <summary>
/// Acquires and caches the host's client-credentials token. Registered as a singleton so the cache
/// and its refresh lock are process-wide: concurrent callers wait on one refresh rather than
/// stampeding the token endpoint.
/// </summary>
public sealed class ClientCredentialsTokenProvider(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    : IClientCredentialsTokenProvider
{
    // Refresh this long before actual expiry so a token handed to an in-flight request cannot
    // expire between the handler attaching it and the receiver validating it.
    private static readonly TimeSpan TokenExpiryMargin = TimeSpan.FromSeconds(60);

    private readonly SemaphoreSlim _tokenLock = new(1, 1);
    private string? _cachedToken;
    private DateTimeOffset _tokenExpiration;

    public async Task<string?> GetTokenAsync(CancellationToken cancellationToken = default)
    {
        if (IsCachedTokenUsable())
        {
            return _cachedToken;
        }

        await _tokenLock.WaitAsync(cancellationToken);
        try
        {
            if (IsCachedTokenUsable())
            {
                return _cachedToken;
            }

            var clientId = configuration.GetValue<string>("AuthorityServer:ClientId");
            var clientSecret = configuration.GetValue<string>("AuthorityServer:ClientSecret");
            var tokenUrl = configuration.GetValue<string>("AuthorityServer:Authority");
            Guard.Against.Null(clientId, message: "Setting 'ClientId' not found.");
            Guard.Against.Null(clientSecret, message: "Setting 'ClientSecret' not found.");

            var formData = new Dictionary<string, string>
            {
                { "grant_type", "client_credentials" },
                { "client_id", clientId },
                { "client_secret", clientSecret },
            };
            var scope = configuration.GetValue<string>("AuthorityServer:Scope");
            if (!string.IsNullOrEmpty(scope))
            {
                formData.Add("scope", scope);
            }

            using var httpClient = httpClientFactory.CreateClient();
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{tokenUrl}/token")
            {
                Content = new FormUrlEncodedContent(formData),
            };

            using var response = await httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var tokenResponse = JsonSerializer.Deserialize<JsonElement>(content);
            var token = tokenResponse.GetProperty("access_token").GetString();
            var lifetime = TimeSpan.FromSeconds(tokenResponse.GetProperty("expires_in").GetInt32());

            // Only take the margin off a token long enough to afford it; a very short-lived token
            // would otherwise be treated as already expired and refetched on every request.
            var margin = lifetime > TokenExpiryMargin + TokenExpiryMargin ? TokenExpiryMargin : TimeSpan.Zero;

            _cachedToken = token;
            _tokenExpiration = DateTimeOffset.UtcNow.Add(lifetime - margin);

            return _cachedToken;
        }
        finally
        {
            _tokenLock.Release();
        }
    }

    private bool IsCachedTokenUsable() => _cachedToken != null && DateTimeOffset.UtcNow < _tokenExpiration;
}
