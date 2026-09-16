using System.Net;
using Common.Web.Infrastructure;
using Microsoft.Extensions.Configuration;

namespace Common.Web.Tests.Infrastructure;

/// <summary>
/// Which callers may set a client's IP through X-Forwarded-For. That address is the anonymous rate
/// limiter's partition key and the audit trail's `ipAddress`, so trusting everyone hands both to the
/// caller — and trusting no one collapses every anonymous visitor into a single bucket.
/// </summary>
public class TrustedProxiesTests
{
    private static IConfiguration Configuration(params string[] networks)
        => new ConfigurationBuilder()
            .AddInMemoryCollection(networks.Select((network, index) =>
                new KeyValuePair<string, string?>($"{TrustedProxies.NetworksKey}:{index}", network)))
            .Build();

    [Fact]
    public void Defaults_AreTheProxyNetworksAServiceCanActuallySit_Behind()
    {
        var options = TrustedProxies.Create(Configuration());

        // Every default must be a parseable CIDR: one that is not would throw here and take every
        // service down at startup.
        Assert.NotEmpty(options.KnownIPNetworks);
        Assert.Empty(options.KnownProxies);
        Assert.Equal(1, options.ForwardLimit);

        Assert.Contains(options.KnownIPNetworks, network => network.Contains(IPAddress.Parse("172.18.0.5")));
        Assert.Contains(options.KnownIPNetworks, network => network.Contains(IPAddress.Parse("127.0.0.1")));
        Assert.Contains(options.KnownIPNetworks, network => network.Contains(IPAddress.Parse("10.1.2.3")));
        Assert.Contains(options.KnownIPNetworks, network => network.Contains(IPAddress.Parse("192.168.1.7")));

        // A public address is never a proxy of ours, whatever it claims in the header.
        Assert.DoesNotContain(options.KnownIPNetworks, network => network.Contains(IPAddress.Parse("203.0.113.9")));
    }

    [Fact]
    public void ConfiguredNetworks_ReplaceTheDefaults()
    {
        var options = TrustedProxies.Create(Configuration("10.42.0.0/16"));

        Assert.Contains(options.KnownIPNetworks, network => network.Contains(IPAddress.Parse("10.42.7.1")));
        Assert.DoesNotContain(options.KnownIPNetworks, network => network.Contains(IPAddress.Parse("192.168.1.7")));
    }

    [Fact]
    public void AnUnparseableConfiguration_FallsBackToTheDefaults()
    {
        // Trusting nothing would leave every request carrying the proxy's own address, which
        // collapses the anonymous rate limiter into one shared bucket for the whole internet.
        var options = TrustedProxies.Create(Configuration("not-a-network", "10.0.0.0/notaprefix"));

        Assert.Contains(options.KnownIPNetworks, network => network.Contains(IPAddress.Parse("172.18.0.5")));
    }
}
