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

using System.Net;
using System.Net.Http.Headers;
using Common.Domain.Enums;
using TrackHub.Router.Infrastructure.Protrack.Helpers;
using TrackHub.Router.Domain.Interfaces;
using TrackHub.Router.Domain.Interfaces.Manager;

namespace TrackHub.Router.Infrastructure.Protrack;

public class ProtrackReaderBase
{
    private readonly ICredentialHttpClientFactory _httpClientFactory;
    private readonly TokenHelper _tokenHelper;
    private CredentialTokenDto? _credential;

    protected IHttpClientService HttpClientService { get; }

    public ProtocolType Protocol => ProtocolType.Protrack;

    protected string AccessToken { get; private set; } = string.Empty;

    protected string BaseUrl { get; private set; } = string.Empty;

    protected ProtrackReaderBase(
        ICredentialHttpClientFactory httpClientFactory,
        IHttpClientService httpClientService,
        ICredentialWriter credentialWriter,
        IProviderSessionStore sessionStore)
    {
        HttpClientService = httpClientService;
        _httpClientFactory = httpClientFactory;
        _tokenHelper = new TokenHelper(credentialWriter, sessionStore);
    }

    public virtual async Task Init(CredentialTokenDto credential, CancellationToken cancellationToken = default)
    {
        _credential = credential;
        var httpClient = _httpClientFactory.CreateClientAsync(credential, cancellationToken);
        httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        BaseUrl = credential.Uri.TrimEnd('/');

        HttpClientService.Init(httpClient, $"{ProtocolType.Protrack}");

        AccessToken = await _tokenHelper.GetTokenAsync(HttpClientService, BaseUrl, credential, null, cancellationToken);
    }

    /// <summary>
    /// Runs a provider read and, if the provider rejects the token with 401, renews the token and
    /// retries once. The read is a factory because Protrack carries the token in the query string,
    /// so the retry has to rebuild the URL around the new one.
    /// </summary>
    private protected async Task<T?> WithReauthenticationAsync<T>(Func<Task<T?>> read, CancellationToken cancellationToken)
    {
        try
        {
            return await read();
        }
        catch (HttpRequestException exception) when (exception.StatusCode == HttpStatusCode.Unauthorized)
        {
            if (_credential is not { } credential)
            {
                throw new InvalidOperationException("Protrack reader was not initialized.");
            }

            AccessToken = await _tokenHelper.GetTokenAsync(HttpClientService, BaseUrl, credential, AccessToken, cancellationToken);
            return await read();
        }
    }
}
