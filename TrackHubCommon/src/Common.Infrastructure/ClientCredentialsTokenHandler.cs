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
using Common.Application.Interfaces;

namespace Common.Infrastructure;

/// <summary>
/// Attaches the host's client-credentials token to an outbound inter-service request.
/// <para>
/// It runs PER REQUEST rather than per client. Attaching the token when the client was built meant
/// blocking network I/O inside a constructor — so resolving a reader from the container performed an
/// HTTP call, and any client held longer than one token lifetime went on presenting an expired one.
/// </para>
/// <para>
/// An <c>Authorization</c> header already on the request is never replaced: on a header-propagating
/// client that header is the CALLER's token, and overwriting it would silently turn a user-scoped
/// call into a service-scoped one.
/// </para>
/// </summary>
public sealed class ClientCredentialsTokenHandler(
    IClientCredentialsTokenProvider tokens,
    bool useServiceIdentity) : DelegatingHandler
{
    protected override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (useServiceIdentity && request.Headers.Authorization is null)
        {
            var token = await tokens.GetTokenAsync(cancellationToken);
            if (!string.IsNullOrEmpty(token))
            {
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            }
        }

        return await base.SendAsync(request, cancellationToken);
    }
}
