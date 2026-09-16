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
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;

namespace Common.Web.Infrastructure;

/// <summary>
/// Forwarded-header options for a service that runs behind the deployment's reverse proxy.
/// <para>
/// The client IP these headers carry is what the anonymous rate limiter partitions on and what audit
/// rows record, so it may only be taken from a proxy the deployment actually has. Trusting the header
/// unconditionally lets anyone who can reach the service port choose their own client IP and with it
/// their own rate-limit bucket.
/// </para>
/// </summary>
public static class TrustedProxies
{
    /// <summary>CIDR networks whose forwarded headers are honoured, as <c>a.b.c.d/length</c>.</summary>
    public const string NetworksKey = "AppSettings:KnownProxyNetworks";

    // The proxy always shares a private network with the service: the container network in a
    // compose deployment, loopback when a service is run directly beside it. A request arriving from
    // a public address is therefore never a proxy, whatever it claims in X-Forwarded-For.
    private static readonly string[] DefaultNetworks =
    [
        "127.0.0.0/8",
        "10.0.0.0/8",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "::1/128",
        "fc00::/7",
    ];

    public static ForwardedHeadersOptions Create(IConfiguration configuration)
    {
        var options = new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
            // One proxy, so only the last hop is believed: nginx appends the real client itself.
            ForwardLimit = 1,
        };

        options.KnownIPNetworks.Clear();
        options.KnownProxies.Clear();

        var configured = configuration.GetSection(NetworksKey).Get<string[]>();
        AddNetworks(options, configured is { Length: > 0 } ? configured : DefaultNetworks);

        // A configuration whose every entry was malformed would otherwise leave the service trusting
        // NOTHING, and then every request carries the proxy's own address: one rate-limit bucket for
        // the whole internet, and one audit trail that names the proxy. The defaults are the safer
        // reading of "this was meant to be configured".
        if (options.KnownIPNetworks.Count == 0)
        {
            AddNetworks(options, DefaultNetworks);
        }

        return options;
    }

    private static void AddNetworks(ForwardedHeadersOptions options, IEnumerable<string> networks)
    {
        foreach (var network in networks)
        {
            if (TryParseNetwork(network, out var parsed))
            {
                options.KnownIPNetworks.Add(parsed);
            }
        }
    }

    private static bool TryParseNetwork(string value, out System.Net.IPNetwork network)
    {
        network = default;
        var parts = value.Split('/', 2);
        if (parts.Length != 2
            || !IPAddress.TryParse(parts[0], out var address)
            || !int.TryParse(parts[1], out var prefixLength))
        {
            return false;
        }

        network = new System.Net.IPNetwork(address, prefixLength);
        return true;
    }
}
