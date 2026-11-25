using System.Reflection;
using Common.Application.Testing;

namespace TrackHub.Security.Application.UnitTests;

// Delegated to the shared engine in Common.Application.Testing so every service enforces the
// identical gate, including keys wrapped inside request DTOs.
[TestFixture]
public class AccountScopeCoverageTests
{
    private static readonly Assembly ApplicationAssembly = Assembly.Load("TrackHub.Security.Application");

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
