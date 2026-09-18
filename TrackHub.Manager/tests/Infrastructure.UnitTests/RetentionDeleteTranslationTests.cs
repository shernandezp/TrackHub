using System.Net.Sockets;
using Npgsql;
using Common.Application.Extensions;
using TrackHub.Manager.Infrastructure;

namespace Infrastructure.UnitTests;

/// <summary>
/// The chunked delete backs every retention job in the platform, and its batch predicate is an
/// expression tree built by hand — the one shape a compiler cannot check. Against the real provider
/// the only passing outcome is a connection failure, which proves the SQL was built.
/// </summary>
[TestFixture]
public class RetentionDeleteTranslationTests
{
    private const string UnreachableConnection = "Host=127.0.0.1;Port=1;Database=none;Username=none;Password=none;Timeout=1;Command Timeout=1";

    private static ApplicationDbContext NewNpgsqlContext()
        => new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(UnreachableConnection)
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .Options);

    [Test]
    public void TheProbeAndTheDeleteBothTranslate()
    {
        using var context = NewNpgsqlContext();
        var cutoff = DateTimeOffset.UtcNow.AddDays(-30);

        var query = context.AuditEvents.Where(x => x.OccurredAt < cutoff);

        Assert.That(query.Select(x => x.AuditEventId).Take(10).ToQueryString(), Does.Contain("LIMIT"));

        // The batch predicate the helper composes: Enumerable.Contains over the key selector's body.
        var keys = new List<Guid> { Guid.NewGuid(), Guid.NewGuid() };
        Assert.That(query.Where(x => keys.Contains(x.AuditEventId)).ToQueryString(), Does.Contain("ANY"));
    }

    [Test]
    public void ExecuteDeleteInChunksBuildsSql()
    {
        using var context = NewNpgsqlContext();
        var cutoff = DateTimeOffset.UtcNow.AddDays(-30);

        // A connection failure is the ONLY passing outcome: it proves EF built the SQL and Npgsql
        // tried to send it. "Could not be translated" means the hand-built predicate is wrong.
        var failure = Assert.CatchAsync(async () => await context.AuditEvents
            .Where(x => x.OccurredAt < cutoff)
            .ExecuteDeleteInChunksAsync(x => x.AuditEventId, CancellationToken.None))!;

        Assert.That(IsConnectionFailure(failure), Is.True, failure.ToString());
    }

    private static bool IsConnectionFailure(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException)
        {
            if (current is NpgsqlException or SocketException or TimeoutException)
            {
                return true;
            }
        }

        return false;
    }
}
