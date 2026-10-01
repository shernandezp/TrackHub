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

using System.Net.Http.Headers;
using Common.Domain.Enums;
using TrackHub.Router.Domain.Interfaces;
using TrackHub.Router.Infrastructure.Samsara.Models;

namespace TrackHub.Router.Infrastructure.Samsara;

/// <summary>
/// Base class for Samsara readers providing common functionality for API communication.
/// Samsara uses Bearer token authentication.
/// </summary>
public class SamsaraReaderBase
{
    private readonly ICredentialHttpClientFactory _httpClientFactory;

    protected IHttpClientService HttpClientService { get; }

    public ProtocolType Protocol => ProtocolType.Samsara;

    protected SamsaraReaderBase(ICredentialHttpClientFactory httpClientFactory, IHttpClientService httpClientService)
    {
        HttpClientService = httpClientService;
        _httpClientFactory = httpClientFactory;
    }

    /// <summary>
    /// Initializes the Samsara reader with the provided credential.
    /// Sets up Bearer token authentication.
    /// </summary>
    public virtual Task Init(CredentialTokenDto credential, CancellationToken cancellationToken = default)
    {
        var httpClient = _httpClientFactory.CreateClientAsync(credential, cancellationToken);
        httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", credential.Token);
        HttpClientService.Init(httpClient, $"{ProtocolType.Samsara}");
        return Task.CompletedTask;
    }

    // Every Samsara list endpoint is cursor-paged; one call reads only the first page.
    internal async Task<IReadOnlyList<T>> GetAllPagesAsync<TResponse, T>(string url, CancellationToken cancellationToken)
        where TResponse : class, ISamsaraPage<T>
    {
        var all = new List<T>();
        string? after = null;
        do
        {
            var pageUrl = after is null ? url : $"{url}{(url.Contains('?') ? '&' : '?')}after={Uri.EscapeDataString(after)}";
            var page = await HttpClientService.GetAsync<TResponse>(pageUrl, cancellationToken: cancellationToken);
            all.AddRange(page?.Data ?? []);
            after = page?.Pagination is { HasNextPage: true, EndCursor: { Length: > 0 } next } && next != after ? next : null;
        }
        while (after is not null);

        return all;
    }
}
