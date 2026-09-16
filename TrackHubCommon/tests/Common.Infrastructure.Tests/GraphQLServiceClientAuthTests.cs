using System.Net;
using Common.Application.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace Common.Infrastructure.Tests;

/// <summary>
/// Pins that the named client REGISTRATION is what authenticates an inter-service call. The token
/// used to be pushed onto the HttpClient by the factory, so any container holding a bare HttpClient
/// still authenticated; it now comes from the registered handler, and a host that skips the
/// registration sends every call unauthenticated — with no compile error and no local test failure.
/// A host that builds its own container is the case to watch.
/// </summary>
public class GraphQLServiceClientAuthTests
{
    private const string ClientName = "Manager";

    private sealed class CapturingHandler : HttpMessageHandler
    {
        internal HttpRequestMessage? Seen { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Seen = request;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }
    }

    private static async Task<HttpRequestMessage> SendThroughAsync(
        Action<IServiceCollection> register, string clientName)
    {
        var captured = new CapturingHandler();
        var tokens = new Mock<IClientCredentialsTokenProvider>();
        tokens.Setup(t => t.GetTokenAsync(It.IsAny<CancellationToken>())).ReturnsAsync("service-token");

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton(tokens.Object);
        register(services);
        services.ConfigureHttpClientDefaults(http => http.ConfigurePrimaryHttpMessageHandler(() => captured));

        await using var provider = services.BuildServiceProvider();
        var client = provider.GetRequiredService<IHttpClientFactory>().CreateClient(clientName);
        client.BaseAddress = new Uri("https://service.invalid/");
        await client.GetAsync("graphql", TestContext.Current.CancellationToken);

        return captured.Seen!;
    }

    [Fact]
    public async Task AnAsServiceTwinAuthenticatesWithTheHostIdentity()
    {
        var sent = await SendThroughAsync(s => s.AddGraphQLServiceClient(ClientName), $"{ClientName}AsService");

        sent.Headers.Authorization!.Parameter.Should().Be("service-token");
    }

    // A worker host has no inbound request to propagate, so it registers its ordinary
    // clients non-propagating and they must still carry the host's own identity.
    [Fact]
    public async Task AWorkerHostsNonPropagatingClientAuthenticatesWithTheHostIdentity()
    {
        var sent = await SendThroughAsync(
            s => s.AddGraphQLClient(ClientName, propagateHeaders: false), ClientName);

        sent.Headers.Authorization!.Parameter.Should().Be("service-token");
    }

    /// <summary>
    /// A propagating client carries the CALLER's token, so the host identity must not be attached —
    /// doing so would silently widen a user-scoped call to a service-scoped one. Propagation itself
    /// needs a live HTTP request, so the inert-handler half is pinned on the handler directly in
    /// <see cref="ClientCredentialsTokenHandlerTests"/>; what this asserts is that registering a
    /// propagating client wires propagation rather than the host identity.
    /// </summary>
    [Fact]
    public async Task APropagatingClientDoesNotFallBackToTheHostIdentity()
    {
        var send = async () => await SendThroughAsync(s => s.AddGraphQLClient(ClientName), ClientName);

        (await send.Should().ThrowAsync<InvalidOperationException>())
            .WithMessage("*HeaderPropagationValues*");
    }
}
