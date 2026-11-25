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

using System.Text;
using Common.Domain.Extensions;

namespace TrackHub.Router.Infrastructure.Common.Helpers;

public class HttpClientService : IHttpClientService
{
    private HttpClient? _httpClient;
    private string? _clientName;

    public void Init(HttpClient httpClient, string clientName)
    {
        _httpClient = httpClient;
        _clientName = clientName;
    }

    public async Task<T?> GetAsync<T>(string url, IDictionary<string, string>? headers = null, CancellationToken cancellationToken = default)
    {
        Guard.Against.Null(_httpClient, message: $"Client configuration for {_clientName} not loaded");

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        if (headers is not null)
        {
            foreach (var item in headers)
            {
                request.Headers.Add(item.Key, item.Value);
            }
        }
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        return content.Deserialize<T>();
    }

    public async Task<T?> PostAsync<T>(string url, object? parameters = null, CancellationToken cancellationToken = default)
    {
        Guard.Against.Null(_httpClient, message: $"Client configuration for {_clientName} not loaded");

        HttpContent? content = null;
        // Content the caller passed in belongs to the caller; only content created here is disposed.
        var ownsContent = parameters is not null and not HttpContent;
        if (parameters is not null)
        {
            content = parameters is HttpContent httpContent
                ? httpContent
                : new StringContent(JsonSerializer.Serialize(parameters), Encoding.UTF8, "application/json");
        }

        try
        {
            using var response = await _httpClient.PostAsync(url, content, cancellationToken);
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
            return responseContent.Deserialize<T>();
        }
        finally
        {
            if (ownsContent)
            {
                content?.Dispose();
            }
        }
    }
}
