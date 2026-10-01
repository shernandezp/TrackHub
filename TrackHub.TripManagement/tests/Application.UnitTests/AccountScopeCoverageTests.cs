using System.Reflection;
using Common.Application.Testing;

namespace TrackHub.TripManagement.Application.UnitTests;

// Tenant-scope coverage (TS-06), delegated to the shared engine in Common.Application.Testing so
// every service enforces the identical gate (including keys WRAPPED inside request DTOs): a
// request that resolves no AccountId but carries a wire entity key must declare
// how its scope is enforced — [AccountScopeEnforcedInHandler] / [PlatformScoped] /
// [AllowCrossAccount].
[TestFixture]
public class AccountScopeCoverageTests
{
    private static readonly Assembly ApplicationAssembly = Assembly.Load("TrackHub.TripManagement.Application");

    [Test]
    public void EveryKeyedRequest_DeclaresHowItsScopeIsEnforced()
    {
        var offenders = AccountScopeCoverage.UndeclaredKeyedRequests(ApplicationAssembly);

        Assert.That(offenders, Is.Empty,
            "These requests carry a wire entity key (root or DTO-wrapped), resolve no AccountId, and "
            + "declare no scope ([AccountScopeEnforcedInHandler] / [PlatformScoped] / [AllowCrossAccount]) "
            + "- a by-id cross-tenant escape shape:\n" + string.Join("\n", offenders));
    }
}