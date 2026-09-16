using System.Net;
using System.Net.Http.Headers;
using Common.Application.Interfaces;
using FluentAssertions;
using Moq;

namespace Common.Infrastructure.Tests;

/// <summary>
/// The service-identity token now travels on the REQUEST, not on the client. Two properties matter
/// and neither is visible from a construction-time attach: the token is fetched per request (so a
/// long-lived client never presents an expired one), and a caller's own token is never replaced —
/// overwriting it would turn a user-scoped call into a service-scoped one.
/// </summary>
public class ClientCredentialsTokenHandlerTests
{
    private sealed class CapturingHandler : HttpMessageHandler
    {
        internal HttpRequestMessage? Seen { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Seen = request;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
        }
    }

    private static (HttpClient Client, CapturingHandler Inner, Mock<IClientCredentialsTokenProvider> Tokens) Build(
        bool useServiceIdentity, string? token = "service-token")
    {
        var tokens = new Mock<IClientCredentialsTokenProvider>();
        tokens.Setup(t => t.GetTokenAsync(It.IsAny<CancellationToken>())).ReturnsAsync(token);

        var inner = new CapturingHandler();
        var handler = new ClientCredentialsTokenHandler(tokens.Object, useServiceIdentity) { InnerHandler = inner };
        return (new HttpClient(handler) { BaseAddress = new Uri("https://service.invalid/") }, inner, tokens);
    }

    [Fact]
    public async Task AServiceClientRequestCarriesTheHostToken()
    {
        var (client, inner, _) = Build(useServiceIdentity: true);

        await client.GetAsync("graphql", TestContext.Current.CancellationToken);

        inner.Seen!.Headers.Authorization.Should().BeEquivalentTo(new AuthenticationHeaderValue("Bearer", "service-token"));
    }

    [Fact]
    public async Task ACallersOwnTokenIsNeverReplaced()
    {
        var (client, inner, tokens) = Build(useServiceIdentity: true);
        var request = new HttpRequestMessage(HttpMethod.Post, "graphql")
        {
            Headers = { Authorization = new AuthenticationHeaderValue("Bearer", "caller-token") },
        };

        await client.SendAsync(request, TestContext.Current.CancellationToken);

        inner.Seen!.Headers.Authorization!.Parameter.Should().Be("caller-token");
        tokens.Verify(t => t.GetTokenAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task AHeaderPropagatingClientInAnApiHostAttachesNothing()
    {
        var (client, inner, tokens) = Build(useServiceIdentity: false);

        await client.GetAsync("graphql", TestContext.Current.CancellationToken);

        inner.Seen!.Headers.Authorization.Should().BeNull();
        tokens.Verify(t => t.GetTokenAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task TheTokenIsFetchedForEveryRequest_SoALongLivedClientCannotGoStale()
    {
        var (client, _, tokens) = Build(useServiceIdentity: true);

        await client.GetAsync("graphql", TestContext.Current.CancellationToken);
        await client.GetAsync("graphql", TestContext.Current.CancellationToken);
        await client.GetAsync("graphql", TestContext.Current.CancellationToken);

        tokens.Verify(t => t.GetTokenAsync(It.IsAny<CancellationToken>()), Times.Exactly(3));
    }

    [Fact]
    public async Task NoTokenAvailable_SendsUnauthenticatedRatherThanThrowing()
    {
        var (client, inner, _) = Build(useServiceIdentity: true, token: null);

        var response = await client.GetAsync("graphql", TestContext.Current.CancellationToken);

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        inner.Seen!.Headers.Authorization.Should().BeNull();
    }
}
