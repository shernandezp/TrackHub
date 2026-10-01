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

using Common.Application.Interfaces;
using Common.Infrastructure.Time;
using FluentAssertions;
using GraphQL;
using GraphQL.Client.Abstractions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Common.Infrastructure.Tests.Services;

public class ManagerAccountTimeZoneResolverTests
{
    private readonly Mock<IGraphQLClient> _client = new();
    private readonly MemoryCache _cache = new(new MemoryCacheOptions());
    private readonly AccountTimeZoneResolverHealth _health = new();
    private readonly ManagerAccountTimeZoneResolver _resolver;

    public ManagerAccountTimeZoneResolverTests()
    {
        var factory = new Mock<IGraphQLClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>(), It.IsAny<bool>())).Returns(_client.Object);
        _resolver = new ManagerAccountTimeZoneResolver(factory.Object, _cache, _health, NullLogger<ManagerAccountTimeZoneResolver>.Instance);
    }

    private void ManagerAnswers(string zone)
        => _client.Setup(c => c.SendQueryAsync<object>(It.IsAny<GraphQLRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GraphQLResponse<object> { Data = System.Text.Json.JsonSerializer.Deserialize<object>($$"""{"accountTimeZone":"{{zone}}"}""")! });

    private void ManagerIsDown()
        => _client.Setup(c => c.SendQueryAsync<object>(It.IsAny<GraphQLRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("connection refused"));

    private void ManagerRefuses()
        => _client.Setup(c => c.SendQueryAsync<object>(It.IsAny<GraphQLRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new GraphQLResponse<object>
            {
                Errors = [new GraphQLError { Message = "denied", Extensions = new Map { ["code"] = "FORBIDDEN" } }],
            });

    [Fact]
    public async Task A_refusal_is_a_configuration_error_even_when_a_zone_is_known()
    {
        var accountId = Guid.NewGuid();
        ManagerAnswers("America/Bogota");
        await _resolver.ResolveAsync(accountId, CancellationToken.None);

        _cache.Remove($"account-timezone:{accountId:N}");
        ManagerRefuses();
        var act = () => _resolver.ResolveAsync(accountId, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        _health.IsFailing.Should().BeTrue();
    }

    [Fact]
    public async Task A_rejected_token_is_a_configuration_error_and_is_not_retried_every_call()
    {
        _client.Setup(c => c.SendQueryAsync<object>(It.IsAny<GraphQLRequest>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new GraphQL.Client.Http.GraphQLHttpRequestException(
                System.Net.HttpStatusCode.Unauthorized, new HttpResponseMessage().Headers, null));
        var accountId = Guid.NewGuid();

        await FluentActions.Invoking(() => _resolver.ResolveAsync(accountId, CancellationToken.None)).Should().ThrowAsync<InvalidOperationException>();
        await FluentActions.Invoking(() => _resolver.ResolveAsync(accountId, CancellationToken.None)).Should().ThrowAsync<InvalidOperationException>();

        _client.Verify(c => c.SendQueryAsync<object>(It.IsAny<GraphQLRequest>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AnOutage_WithNoZoneKnownYet_Fails_InsteadOfAnsweringUtc()
    {
        ManagerIsDown();

        var act = () => _resolver.ResolveAsync(Guid.NewGuid(), CancellationToken.None);

        await act.Should().ThrowAsync<HttpRequestException>();
        _health.IsFailing.Should().BeTrue();
    }

    [Fact]
    public async Task AnOutage_AfterAZoneWasRead_KeepsThatZone_AndReportsItself()
    {
        var accountId = Guid.NewGuid();
        ManagerAnswers("America/Bogota");
        (await _resolver.ResolveAsync(accountId, CancellationToken.None)).Id.Should().Be("America/Bogota");
        _health.IsFailing.Should().BeFalse();

        _cache.Remove($"account-timezone:{accountId:N}");
        ManagerIsDown();
        var zone = await _resolver.ResolveAsync(accountId, CancellationToken.None);

        zone.Id.Should().Be("America/Bogota");
        _health.IsFailing.Should().BeTrue();
    }
}
