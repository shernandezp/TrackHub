using System.Reflection;
using Common.Application.Attributes;
using Common.Application.Behaviors;
using Common.Application.Exceptions;
using Common.Application.Interfaces;
using Common.Mediator;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace Common.Application.Tests.Behaviors;

public class AccountScopeBehaviorTests
{
    private readonly Mock<ICurrentPrincipal> _principalMock = new();
    private readonly Mock<ILogger<AccountScopeBehavior<AccountScopedRequest, string>>> _scopedLoggerMock = new();
    private readonly Mock<ILogger<AccountScopeBehavior<CrossAccountRequest, string>>> _crossLoggerMock = new();

    public class PlainRequest : IRequest<string> { }

    public class AccountScopedRequest : IRequest<string>
    {
        public Guid AccountId { get; init; }
    }

    [AllowCrossAccount("Test fixture standing in for the Router/SyncWorker global feed.")]
    public class CrossAccountRequest : IRequest<string>
    {
        public Guid AccountId { get; init; }
    }

    private AccountScopeBehavior<AccountScopedRequest, string> ScopedBehavior()
        => new(_principalMock.Object, _scopedLoggerMock.Object);

    [Fact]
    public async Task Handle_SameAccount_ProceedsToNext()
    {
        var accountId = Guid.NewGuid();
        _principalMock.Setup(p => p.AccountId).Returns(accountId);

        var result = await ScopedBehavior().HandleAsync(
            new AccountScopedRequest { AccountId = accountId }, () => Task.FromResult("OK"), CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_CrossAccount_ThrowsForbidden()
    {
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());

        var act = () => ScopedBehavior().HandleAsync(
            new AccountScopedRequest { AccountId = Guid.NewGuid() }, () => Task.FromResult("OK"), CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_PrincipalWithNoAccount_ThrowsForbidden()
    {
        _principalMock.Setup(p => p.AccountId).Returns((Guid?)null);
        _principalMock.Setup(p => p.PrincipalType).Returns(PrincipalType.ServiceClient);

        var act = () => ScopedBehavior().HandleAsync(
            new AccountScopedRequest { AccountId = Guid.NewGuid() }, () => Task.FromResult("OK"), CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_PrincipalWithEmptyAccount_ThrowsForbidden()
    {
        _principalMock.Setup(p => p.AccountId).Returns(Guid.Empty);

        var act = () => ScopedBehavior().HandleAsync(
            new AccountScopedRequest { AccountId = Guid.NewGuid() }, () => Task.FromResult("OK"), CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_AllowCrossAccount_PermitsMismatch()
    {
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());
        var behavior = new AccountScopeBehavior<CrossAccountRequest, string>(
            _principalMock.Object, _crossLoggerMock.Object);

        var result = await behavior.HandleAsync(
            new CrossAccountRequest { AccountId = Guid.NewGuid() }, () => Task.FromResult("OK"), CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_AllowCrossAccount_PermitsGlobalServiceIdentityWithNoAccount()
    {
        _principalMock.Setup(p => p.AccountId).Returns((Guid?)null);
        _principalMock.Setup(p => p.PrincipalType).Returns(PrincipalType.ServiceClient);
        var behavior = new AccountScopeBehavior<CrossAccountRequest, string>(
            _principalMock.Object, _crossLoggerMock.Object);

        var result = await behavior.HandleAsync(
            new CrossAccountRequest { AccountId = Guid.NewGuid() }, () => Task.FromResult("OK"), CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_EmptyAccountIdOnRequest_IsUnaffected()
    {
        // Guid.Empty means "the request named no account"; scope is then resolved by the handler
        // from the principal itself, which cannot cross tenants.
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());

        var result = await ScopedBehavior().HandleAsync(
            new AccountScopedRequest { AccountId = Guid.Empty }, () => Task.FromResult("OK"), CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public void AllowCrossAccount_RequiresAJustification()
    {
        var act = () => new AllowCrossAccountAttribute("  ");

        act.Should().Throw<ArgumentException>();
    }

    // Nested account ids: several commands carry the tenant inside a DTO member, and the handler-level
    // unit suites never run the pipeline, so these tests are the only proof the guard reaches them.

    public readonly record struct AccountBearingDto(Guid AccountId, string Payload);

    public readonly record struct AccountlessDto(string Payload);

    public readonly record struct OuterDto(AccountBearingDto Inner);

    public readonly record struct DeeperDto(OuterDto Middle);

    public class NestedAccountRequest : IRequest<string>
    {
        public AccountBearingDto Dto { get; init; }
    }

    [AllowCrossAccount("Test fixture standing in for a global service identity emitting per-tenant events.")]
    public class NestedCrossAccountRequest : IRequest<string>
    {
        public AccountBearingDto Dto { get; init; }
    }

    public class NoAccountAnywhereRequest : IRequest<string>
    {
        public AccountlessDto Dto { get; init; }

        public string Name { get; init; } = string.Empty;

        public Uri Endpoint { get; init; } = new("https://example.invalid");
    }

    /// <summary>Top-level and nested accounts disagree — the root must win.</summary>
    public class TopLevelAndNestedRequest : IRequest<string>
    {
        public Guid AccountId { get; init; }

        public AccountBearingDto Dto { get; init; }
    }

    /// <summary>Account two levels below the root (request → OuterDto → AccountBearingDto).</summary>
    public class DepthTwoRequest : IRequest<string>
    {
        public OuterDto Outer { get; init; }
    }

    /// <summary>Account three levels below the root — deliberately BEYOND the depth limit.</summary>
    public class DepthThreeRequest : IRequest<string>
    {
        public DeeperDto Deep { get; init; }
    }

    /// <summary>A batch names many accounts, not one: collections are deliberately not walked.</summary>
    public class CollectionNestedRequest : IRequest<string>
    {
        public IReadOnlyCollection<AccountBearingDto> Items { get; init; } = [];
    }

    public class NullableNestedRequest : IRequest<string>
    {
        public AccountBearingDto? Dto { get; init; }
    }

    private AccountScopeBehavior<TRequest, string> BehaviorFor<TRequest>() where TRequest : notnull
        => new(_principalMock.Object, Mock.Of<ILogger<AccountScopeBehavior<TRequest, string>>>());

    [Fact]
    public async Task Handle_NestedAccount_SameAccount_ProceedsToNext()
    {
        var accountId = Guid.NewGuid();
        _principalMock.Setup(p => p.AccountId).Returns(accountId);

        var result = await BehaviorFor<NestedAccountRequest>().HandleAsync(
            new NestedAccountRequest { Dto = new AccountBearingDto(accountId, "x") },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_NestedAccount_CrossAccount_ThrowsForbidden()
    {
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());

        var act = () => BehaviorFor<NestedAccountRequest>().HandleAsync(
            new NestedAccountRequest { Dto = new AccountBearingDto(Guid.NewGuid(), "x") },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_NestedAccount_GlobalServiceIdentity_ThrowsForbidden()
    {
        _principalMock.Setup(p => p.AccountId).Returns((Guid?)null);
        _principalMock.Setup(p => p.PrincipalType).Returns(PrincipalType.ServiceClient);

        var act = () => BehaviorFor<NestedAccountRequest>().HandleAsync(
            new NestedAccountRequest { Dto = new AccountBearingDto(Guid.NewGuid(), "x") },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_NestedAccount_AllowCrossAccount_PermitsMismatch()
    {
        _principalMock.Setup(p => p.AccountId).Returns((Guid?)null);
        _principalMock.Setup(p => p.PrincipalType).Returns(PrincipalType.ServiceClient);

        var result = await BehaviorFor<NestedCrossAccountRequest>().HandleAsync(
            new NestedCrossAccountRequest { Dto = new AccountBearingDto(Guid.NewGuid(), "x") },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_NoAccountAnywhere_CallerHasAccount_ProceedsToNext()
    {
        // No reachable AccountId and no marker: the account is derived from the caller's identity.
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());

        var result = await BehaviorFor<NoAccountAnywhereRequest>().HandleAsync(
            new NoAccountAnywhereRequest { Dto = new AccountlessDto("x") },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_NestedEmptyAccount_IsUnaffected()
    {
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());

        var result = await BehaviorFor<NestedAccountRequest>().HandleAsync(
            new NestedAccountRequest { Dto = new AccountBearingDto(Guid.Empty, "x") },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_NullNestedDto_IsUnaffected()
    {
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());

        var result = await BehaviorFor<NullableNestedRequest>().HandleAsync(
            new NullableNestedRequest { Dto = null },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_TopLevelAccountWinsOverNested_PassesOnMatchingTopLevel()
    {
        var accountId = Guid.NewGuid();
        _principalMock.Setup(p => p.AccountId).Returns(accountId);

        // The nested DTO names a foreign account and the root the caller's own; the root is authoritative,
        // so this passes and the handler must not trust the DTO's copy of the id.
        var result = await BehaviorFor<TopLevelAndNestedRequest>().HandleAsync(
            new TopLevelAndNestedRequest
            {
                AccountId = accountId,
                Dto = new AccountBearingDto(Guid.NewGuid(), "x")
            },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_TopLevelAccountWinsOverNested_ForbidsOnMismatchingTopLevel()
    {
        var accountId = Guid.NewGuid();
        _principalMock.Setup(p => p.AccountId).Returns(accountId);

        // Converse of the above: a matching nested id cannot rescue a foreign root id.
        var act = () => BehaviorFor<TopLevelAndNestedRequest>().HandleAsync(
            new TopLevelAndNestedRequest
            {
                AccountId = Guid.NewGuid(),
                Dto = new AccountBearingDto(accountId, "x")
            },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_AccountTwoLevelsDeep_IsGuarded()
    {
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());

        var act = () => BehaviorFor<DepthTwoRequest>().HandleAsync(
            new DepthTwoRequest { Outer = new OuterDto(new AccountBearingDto(Guid.NewGuid(), "x")) },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_AccountBeyondTheDepthLimit_IsNotSeenAndFallsBackToCaller()
    {
        // An account three levels deep is out of the guard's reach, so the account is derived from the
        // caller. Documents the bound, not an endorsement: requests carry a top-level AccountId.
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());

        var result = await BehaviorFor<DepthThreeRequest>().HandleAsync(
            new DepthThreeRequest { Deep = new DeeperDto(new OuterDto(new AccountBearingDto(Guid.NewGuid(), "x"))) },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        result.Should().Be("OK");
    }

    // A request resolving no account off the wire: [AllowCrossAccount] and [PlatformScoped] pass;
    // [AccountScopeEnforcedInHandler] behaves like an unmarked request at runtime; unmarked passes only
    // when the principal has an account.

    public readonly record struct ByIdRequest(Guid Id) : IRequest<string>;

    [AccountScopeEnforcedInHandler]
    public readonly record struct EnforcedByIdRequest(Guid Id) : IRequest<string>;

    [PlatformScoped("Test fixture standing in for platform-owned catalog data.")]
    public readonly record struct PlatformScopedByIdRequest(Guid Id) : IRequest<string>;

    [AllowCrossAccount("Test fixture standing in for a batch that names many accounts in a collection.")]
    public class CrossAccountCollectionRequest : IRequest<string>
    {
        public IReadOnlyCollection<AccountBearingDto> Items { get; init; } = [];
    }

    [PlatformScoped("Test fixture standing in for platform status with no tenant dimension.")]
    public class PlatformScopedPlainRequest : IRequest<string> { }

    [Fact]
    public async Task Handle_UnmarkedByIdRequest_CallerHasAccount_ProceedsToNext()
    {
        // No account on the wire, no marker: passes for a user principal with an account.
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());

        var result = await BehaviorFor<ByIdRequest>().HandleAsync(
            new ByIdRequest(Guid.NewGuid()), () => Task.FromResult("OK"), CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_UnmarkedByIdRequest_PrincipalHasNoAccount_ThrowsForbidden()
    {
        // The fail-closed line: a global service identity with NO account scope reaching an unmarked,
        // account-less request cannot be scoped to any tenant, so it is denied.
        _principalMock.Setup(p => p.AccountId).Returns((Guid?)null);
        _principalMock.Setup(p => p.PrincipalType).Returns(PrincipalType.ServiceClient);

        var act = () => BehaviorFor<ByIdRequest>().HandleAsync(
            new ByIdRequest(Guid.NewGuid()), () => Task.FromResult("OK"), CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_UnmarkedByIdRequest_PrincipalHasEmptyAccount_ThrowsForbidden()
    {
        _principalMock.Setup(p => p.AccountId).Returns(Guid.Empty);

        var act = () => BehaviorFor<ByIdRequest>().HandleAsync(
            new ByIdRequest(Guid.NewGuid()), () => Task.FromResult("OK"), CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_EnforcedByIdRequest_CallerHasAccount_ProceedsToNext()
    {
        // With a real caller account the request proceeds and the handler's ownership check applies downstream.
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());

        var result = await BehaviorFor<EnforcedByIdRequest>().HandleAsync(
            new EnforcedByIdRequest(Guid.NewGuid()), () => Task.FromResult("OK"), CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_EnforcedByIdRequest_PrincipalHasNoAccount_ThrowsForbidden()
    {
        // [AccountScopeEnforcedInHandler] does not admit account-less principals: the handler's
        // ownership check needs a caller account to check AGAINST. A global service identity that
        // legitimately needs a keyed lookup must use a dedicated [AllowCrossAccount] request.
        _principalMock.Setup(p => p.AccountId).Returns((Guid?)null);
        _principalMock.Setup(p => p.PrincipalType).Returns(PrincipalType.ServiceClient);

        var act = () => BehaviorFor<EnforcedByIdRequest>().HandleAsync(
            new EnforcedByIdRequest(Guid.NewGuid()), () => Task.FromResult("OK"), CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_PlatformScopedByIdRequest_PassesEvenForNoAccountPrincipal()
    {
        _principalMock.Setup(p => p.AccountId).Returns((Guid?)null);

        var result = await BehaviorFor<PlatformScopedByIdRequest>().HandleAsync(
            new PlatformScopedByIdRequest(Guid.NewGuid()), () => Task.FromResult("OK"), CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_CollectionRequest_Unmarked_CallerHasAccount_ProceedsToNext()
    {
        // The resolver never descends into a collection, so this is scoped to the caller's own account.
        _principalMock.Setup(p => p.AccountId).Returns(Guid.NewGuid());

        var result = await BehaviorFor<CollectionNestedRequest>().HandleAsync(
            new CollectionNestedRequest { Items = [new AccountBearingDto(Guid.NewGuid(), "x")] },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_CollectionRequest_Unmarked_ServiceIdentity_ThrowsForbidden()
    {
        // A collection reached by a service identity with no account cannot be scoped, so it is denied.
        _principalMock.Setup(p => p.AccountId).Returns((Guid?)null);
        _principalMock.Setup(p => p.PrincipalType).Returns(PrincipalType.ServiceClient);

        var act = () => BehaviorFor<CollectionNestedRequest>().HandleAsync(
            new CollectionNestedRequest { Items = [new AccountBearingDto(Guid.NewGuid(), "x")] },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        await act.Should().ThrowAsync<ForbiddenAccessException>();
    }

    [Fact]
    public async Task Handle_CollectionRequest_MarkedAllowCrossAccount_ProceedsToNext()
    {
        _principalMock.Setup(p => p.AccountId).Returns((Guid?)null);
        _principalMock.Setup(p => p.PrincipalType).Returns(PrincipalType.ServiceClient);

        var result = await BehaviorFor<CrossAccountCollectionRequest>().HandleAsync(
            new CrossAccountCollectionRequest { Items = [new AccountBearingDto(Guid.NewGuid(), "x")] },
            () => Task.FromResult("OK"),
            CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_PlainRequestNoAccount_MarkedPlatformScoped_ProceedsToNext()
    {
        _principalMock.Setup(p => p.AccountId).Returns((Guid?)null);

        var result = await BehaviorFor<PlatformScopedPlainRequest>().HandleAsync(
            new PlatformScopedPlainRequest(), () => Task.FromResult("OK"), CancellationToken.None);

        result.Should().Be("OK");
    }

    [Fact]
    public void PlatformScoped_RequiresAJustification()
    {
        var act = () => new PlatformScopedAttribute(" ");

        act.Should().Throw<ArgumentException>();
    }

    // The resolver only recurses into TrackHub*/Common.* assemblies. These cases emit types into a
    // dynamic `TrackHub.*` assembly and a `System.*`-named one, so both arms of IsTrackHubComplexType run.

    private static Type EmitNestedAccountRequest(string assemblyName)
    {
        var asm = System.Reflection.Emit.AssemblyBuilder.DefineDynamicAssembly(
            new AssemblyName(assemblyName), System.Reflection.Emit.AssemblyBuilderAccess.Run);
        var module = asm.DefineDynamicModule(assemblyName);

        // A DTO that carries an AccountId, declared in `assemblyName`.
        var dto = module.DefineType("AccountBearingDto", TypeAttributes.Public | TypeAttributes.Class);
        DefineAutoProperty(dto, "AccountId", typeof(Guid));

        // A request whose only account lives one level down, inside that DTO.
        var req = module.DefineType("NestedRequest", TypeAttributes.Public | TypeAttributes.Class);
        DefineAutoProperty(req, "Dto", dto.CreateType());

        return req.CreateType();
    }

    private static void DefineAutoProperty(System.Reflection.Emit.TypeBuilder type, string name, Type propertyType)
    {
        var field = type.DefineField($"<{name}>k__BackingField", propertyType, FieldAttributes.Private);
        var property = type.DefineProperty(name, PropertyAttributes.None, propertyType, null);

        var getter = type.DefineMethod(
            $"get_{name}",
            MethodAttributes.Public | MethodAttributes.SpecialName | MethodAttributes.HideBySig,
            propertyType,
            Type.EmptyTypes);
        var il = getter.GetILGenerator();
        il.Emit(System.Reflection.Emit.OpCodes.Ldarg_0);
        il.Emit(System.Reflection.Emit.OpCodes.Ldfld, field);
        il.Emit(System.Reflection.Emit.OpCodes.Ret);
        property.SetGetMethod(getter);
    }

    [Fact]
    public void NamesAccount_NestedAccountInTrackHubAssembly_IsResolved()
    {
        // The `TrackHub` arm of IsTrackHubComplexType.
        var type = EmitNestedAccountRequest("TrackHub.Fake.Application");

        RequestAccountResolver.NamesAccount(type).Should().BeTrue();
    }

    [Fact]
    public void NamesAccount_NestedAccountInSystemAssembly_TerminatesWalk()
    {
        // A framework-named assembly must NOT be descended into: an AccountId buried inside a
        // System.* type is out of reach, so the request resolves no account.
        var type = EmitNestedAccountRequest("System.Fake.Dynamic");

        RequestAccountResolver.NamesAccount(type).Should().BeFalse();
    }
}
