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

namespace Common.Domain.Http;

/// <summary>
/// Classifies a destination the platform would dial on a caller's behalf. Shared by every
/// outbound-URL rule so credential URIs and webhook subscriptions cannot drift apart.
/// </summary>
public static class NonRoutableAddress
{
    public static readonly string[] MetadataHosts =
    [
        "metadata.google.internal",
        "metadata.goog",
        "instance-data"
    ];

    public static bool IsNonRoutable(IPAddress address)
    {
        ArgumentNullException.ThrowIfNull(address);

        if (address.IsIPv4MappedToIPv6)
        {
            address = address.MapToIPv4();
        }

        if (IPAddress.IsLoopback(address) || address.Equals(IPAddress.Any) || address.Equals(IPAddress.IPv6Any))
        {
            return true;
        }

        if (address.AddressFamily == AddressFamily.InterNetworkV6)
        {
            // fe80::/10 link-local and fc00::/7 unique-local.
            return address.IsIPv6LinkLocal || address.IsIPv6SiteLocal || (address.GetAddressBytes()[0] & 0xFE) == 0xFC;
        }

        var octets = address.GetAddressBytes();
        return octets[0] switch
        {
            10 => true,
            127 => true,
            // 100.64.0.0/10 carrier-grade NAT.
            100 => octets[1] >= 64 && octets[1] <= 127,
            // 169.254.0.0/16 link-local, which covers the 169.254.169.254 metadata service.
            169 => octets[1] == 254,
            172 => octets[1] >= 16 && octets[1] <= 31,
            192 => octets[1] == 168,
            _ => false
        };
    }

    public static bool IsNonRoutableHostName(string? host)
        => !string.IsNullOrWhiteSpace(host)
            && (host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
                || host.EndsWith(".localhost", StringComparison.OrdinalIgnoreCase)
                || MetadataHosts.Contains(host, StringComparer.OrdinalIgnoreCase));

    /// <summary>
    /// Literal-address and well-known-name check for a URL being stored. A name that RESOLVES to a
    /// non-routable address is caught at dial time instead, which is what a later DNS change cannot
    /// evade.
    /// </summary>
    public static bool TargetsNonRoutableHost(string? uri)
    {
        if (!Uri.TryCreate(uri, UriKind.Absolute, out var parsed))
        {
            return false;
        }

        var host = parsed.DnsSafeHost;
        return IPAddress.TryParse(host, out var address)
            ? IsNonRoutable(address)
            : IsNonRoutableHostName(host);
    }
}
