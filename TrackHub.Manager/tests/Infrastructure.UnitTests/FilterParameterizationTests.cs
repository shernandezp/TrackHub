using Common.Domain.Helpers;
using TrackHub.Manager.Infrastructure;

namespace Infrastructure.UnitTests;

/// <summary>
/// Pins that a <see cref="Filters"/> predicate reaches PostgreSQL as a PARAMETER. A constant would
/// change the SQL text per value, so the plan cache, auto-prepare and pg_stat_statements all miss.
/// </summary>
[TestFixture]
public class FilterParameterizationTests
{
    private const string UnreachableConnection = "Host=127.0.0.1;Port=1;Database=none;Username=none;Password=none;Timeout=1;Command Timeout=1";

    private static ApplicationDbContext NewNpgsqlContext()
        => new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(UnreachableConnection)
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .Options);

    [Test]
    public void TwoDistinctValuesProduceTheSameSql()
    {
        using var context = NewNpgsqlContext();

        var first = SqlFor(context, Guid.NewGuid());
        var second = SqlFor(context, Guid.NewGuid());

        Assert.Multiple(() =>
        {
            Assert.That(first, Does.Contain("@"), "the filter value must arrive as a parameter");
            Assert.That(second, Is.EqualTo(first));
        });
    }

    private static string SqlFor(ApplicationDbContext context, Guid transporterId)
        => Statement(new Filters(new Dictionary<string, object>
            {
                [nameof(TransporterPositionHistory.TransporterId)] = transporterId,
            })
            .Apply(context.TransporterPositionHistory)
            .ToQueryString());

    // ToQueryString prefixes the statement with one `-- @p='value'` line per parameter; the
    // statement below them is what the plan cache keys on.
    private static string Statement(string queryString)
        => string.Join(Environment.NewLine, queryString
            .Split(Environment.NewLine)
            .SkipWhile(line => line.StartsWith("--", StringComparison.Ordinal)));

    /// <summary>Every filter reads a member called `Value`, so two of them must not collide.</summary>
    [Test]
    public void SeveralFiltersEachGetTheirOwnParameter()
    {
        using var context = NewNpgsqlContext();

        var sql = new Filters(new Dictionary<string, object>
            {
                [nameof(TransporterPositionHistory.AccountId)] = Guid.NewGuid(),
                [nameof(TransporterPositionHistory.TransporterId)] = Guid.NewGuid(),
                [nameof(TransporterPositionHistory.DeviceId)] = Guid.NewGuid(),
            })
            .Apply(context.TransporterPositionHistory)
            .ToQueryString();

        var parameters = System.Text.RegularExpressions.Regex.Matches(Statement(sql), "@[A-Za-z0-9_]+")
            .Select(m => m.Value)
            .Distinct()
            .ToList();

        Assert.That(parameters, Has.Count.EqualTo(3), sql);
    }
}
