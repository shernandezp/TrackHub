using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Options;

namespace Common.Infrastructure.Tests;

/// <summary>
/// Pins that a client's declared <c>timeoutSeconds</c> reaches the resilience pipeline, which sits inside
/// <c>HttpClient.Timeout</c> and would otherwise cut every attempt off at its 10 s default.
/// </summary>
public class GraphQLClientTimeoutTests
{
    private const string ClientName = "TestClient";

    private static ServiceProvider Build(int timeoutSeconds, GraphQLClientResilience resilience)
    {
        var services = new ServiceCollection();
        // A real host always has configuration; the token provider reads it to acquire the host token.
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
        services.AddLogging();
        services.AddGraphQLClient(ClientName, propagateHeaders: false, resilience, timeoutSeconds);
        return services.BuildServiceProvider();
    }

    private static HttpStandardResilienceOptions ResilienceOptions(ServiceProvider provider)
        // AddStandardResilienceHandler names its options '{client}-standard' — the same name that
        // appears in the Polly telemetry ("Router-standard"/"Standard-AttemptTimeout").
        => provider.GetRequiredService<IOptionsMonitor<HttpStandardResilienceOptions>>().Get($"{ClientName}-standard");

    [Theory]
    [InlineData(GraphQLClientResilience.NoRetry)]
    [InlineData(GraphQLClientResilience.WithRetry)]
    public void DeclaredTimeout_BecomesTheAttemptTimeout(GraphQLClientResilience resilience)
    {
        using var provider = Build(120, resilience);

        var options = ResilienceOptions(provider);

        options.AttemptTimeout.Timeout.Should().Be(TimeSpan.FromSeconds(120),
            "a client asking for 120 s must not be cut off at the 10 s standard default");
        options.TotalRequestTimeout.Timeout.Should().BeGreaterThan(options.AttemptTimeout.Timeout);
        options.CircuitBreaker.SamplingDuration.Should().BeGreaterThanOrEqualTo(options.AttemptTimeout.Timeout * 2);
    }

    [Fact]
    public void DefaultTimeout_IsAlsoApplied_NotLeftAtTheStandardTenSeconds()
    {
        using var provider = Build(30, GraphQLClientResilience.NoRetry);

        ResilienceOptions(provider).AttemptTimeout.Timeout.Should().Be(TimeSpan.FromSeconds(30));
    }

    /// <summary>
    /// The standard handler disables HttpClient.Timeout, so an unconfigured pipeline's 10 s default would be
    /// the only limit in force, whatever the caller declared.
    /// </summary>
    [Fact]
    public void ResiliencePipeline_TakesOverFromHttpClientTimeout()
    {
        using var provider = Build(120, GraphQLClientResilience.WithRetry);

        var client = provider.GetRequiredService<IHttpClientFactory>().CreateClient(ClientName);

        client.Timeout.Should().Be(Timeout.InfiniteTimeSpan);
        ResilienceOptions(provider).AttemptTimeout.Timeout.Should().Be(TimeSpan.FromSeconds(120));
    }

    /// <summary>Without a pipeline there is nothing to take over, so the outer timeout stands.</summary>
    [Fact]
    public void WithoutAPipeline_TheHttpClientTimeoutStands()
    {
        using var provider = Build(45, GraphQLClientResilience.None);

        var client = provider.GetRequiredService<IHttpClientFactory>().CreateClient(ClientName);

        client.Timeout.Should().Be(TimeSpan.FromSeconds(45));
    }

    /// <summary>
    /// The library validates these against each other on first resolution and throws at startup, so
    /// resolving the client is the assertion.
    /// </summary>
    [Theory]
    [InlineData(1)]
    [InlineData(30)]
    [InlineData(120)]
    [InlineData(600)]
    public void ConfiguredTimeouts_PassTheLibrarysOwnValidation(int timeoutSeconds)
    {
        using var provider = Build(timeoutSeconds, GraphQLClientResilience.NoRetry);

        var act = () => provider.GetRequiredService<IHttpClientFactory>().CreateClient(ClientName);

        act.Should().NotThrow();
    }
}
