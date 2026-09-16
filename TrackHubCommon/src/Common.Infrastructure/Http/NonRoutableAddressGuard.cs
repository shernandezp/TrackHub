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
using System.Net.Sockets;
using Common.Domain.Http;

namespace Common.Infrastructure.Http;

/// <summary>
/// Egress control for clients that dial a URL supplied by a tenant.
/// <para>
/// Validating the host when the URL is stored is not sufficient on its own: the name is resolved
/// again when the request is dialled, so a host whose A record changes afterwards still reaches an
/// internal address. This callback is the control a later DNS change cannot evade.
/// </para>
/// </summary>
public static class NonRoutableAddressGuard
{
    public static Func<SocketsHttpConnectionContext, CancellationToken, ValueTask<Stream>> ConnectCallback()
        => async (context, cancellationToken) =>
        {
            var host = context.DnsEndPoint.Host;
            if (NonRoutableAddress.IsNonRoutableHostName(host))
            {
                throw new HttpRequestException($"Refusing to connect to the non-routable host '{host}'.");
            }

            var addresses = IPAddress.TryParse(host, out var literal)
                ? [literal]
                : await Dns.GetHostAddressesAsync(host, cancellationToken);

            var target = Array.Find(addresses, a => !NonRoutableAddress.IsNonRoutable(a))
                ?? throw new HttpRequestException($"Refusing to connect to the non-routable host '{host}'.");

            var socket = new Socket(SocketType.Stream, ProtocolType.Tcp) { NoDelay = true };
            try
            {
                await socket.ConnectAsync(new IPEndPoint(target, context.DnsEndPoint.Port), cancellationToken);
                return new NetworkStream(socket, ownsSocket: true);
            }
            catch
            {
                socket.Dispose();
                throw;
            }
        };
}
