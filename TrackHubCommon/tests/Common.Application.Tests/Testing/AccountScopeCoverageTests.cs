using Common.Application.Attributes;
using Common.Application.Testing;
using Common.Mediator;
using FluentAssertions;

namespace Common.Application.Tests.Testing;

/// <summary>
/// Proves the shared TS-06 coverage engine (<see cref="AccountScopeCoverage"/>) that every
/// service's <c>AccountScopeCoverageTests</c> delegates to. The critical case is the WRAPPED key:
/// a wire key hidden one level down inside a TrackHub-owned DTO (the <c>FiltersInput</c> shape)
/// must be found — a root-only inspection let exactly those requests bypass the gate.
/// </summary>
public class AccountScopeCoverageTests
{
    // --- fixtures: keyed / keyless shapes -------------------------------------------------

    public readonly record struct FiltersDto(Guid DeviceId, string? Search);

    public readonly record struct KeylessFiltersDto(string? Search, int Page);

    /// <summary>Root-level wire key, unmarked — the classic offender.</summary>
    public class RootKeyRequest : IRequest<string>
    {
        public Guid Id { get; init; }
    }

    /// <summary>Wire key WRAPPED in a DTO member — must still be detected (the hardening).</summary>
    public class WrappedKeyRequest : IRequest<string>
    {
        public FiltersDto Filters { get; init; }
    }

    [AccountScopeEnforcedInHandler]
    public class WrappedKeyMarkedRequest : IRequest<string>
    {
        public FiltersDto Filters { get; init; }
    }

    /// <summary>No key anywhere — caller-scoped, needs no marker.</summary>
    public class KeylessRequest : IRequest<string>
    {
        public KeylessFiltersDto Filters { get; init; }

        public string Name { get; init; } = string.Empty;
    }

    /// <summary>A key beside the wire account: the account check does not cover the second hop.</summary>
    public class AccountBearingKeyedRequest : IRequest<string>
    {
        public Guid AccountId { get; init; }

        public Guid DeviceId { get; init; }
    }

    public class AccountOnlyRequest : IRequest<string>
    {
        public Guid AccountId { get; init; }

        public int Take { get; init; }
    }

    /// <summary>An optional account names any account or none.</summary>
    public class NullableAccountRequest : IRequest<string>
    {
        public Guid? AccountId { get; init; }
    }

    public class IntKeyRequest : IRequest<string>
    {
        public int RoleId { get; init; }
    }

    public class CatalogCodeRequest : IRequest<string>
    {
        public Guid AccountId { get; init; }

        public short TransporterTypeId { get; init; }

        public string TimeZoneId { get; init; } = string.Empty;

        public IReadOnlyCollection<string> EventTypes { get; init; } = [];
    }

    private static IReadOnlyList<string> UndeclaredKeyed()
        => AccountScopeCoverage.UndeclaredKeyedRequests(typeof(AccountScopeCoverageTests).Assembly);

    [Fact]
    public void UndeclaredKeyedRequests_FindsRootLevelKey()
    {
        UndeclaredKeyed().Should().Contain(typeof(RootKeyRequest).FullName);
    }

    [Fact]
    public void UndeclaredKeyedRequests_FindsKeyWrappedInsideDto()
    {
        // The FiltersInput shape: the key sits one level down inside a TrackHub-owned DTO. A
        // root-only inspection missed it; the shared walk must not.
        UndeclaredKeyed().Should().Contain(typeof(WrappedKeyRequest).FullName);
    }

    [Fact]
    public void UndeclaredKeyedRequests_AcceptsDeclaredAndKeylessShapes()
    {
        var offenders = UndeclaredKeyed();

        offenders.Should().NotContain(typeof(WrappedKeyMarkedRequest).FullName,
            "a declared [AccountScopeEnforcedInHandler] request is covered");
        offenders.Should().NotContain(typeof(KeylessRequest).FullName,
            "a keyless request is caller-scoped and needs no marker");
        offenders.Should().NotContain(typeof(AccountOnlyRequest).FullName,
            "a required account is the scope itself");
        offenders.Should().NotContain(typeof(CatalogCodeRequest).FullName,
            "catalog codes and string lists name no tenant entity");
    }

    [Fact]
    public void UndeclaredKeyedRequests_FindsSecondHopOptionalAccountAndIntKeys()
    {
        var offenders = UndeclaredKeyed();

        offenders.Should().Contain(typeof(AccountBearingKeyedRequest).FullName);
        offenders.Should().Contain(typeof(NullableAccountRequest).FullName);
        offenders.Should().Contain(typeof(IntKeyRequest).FullName);
    }
}
