using Common.Application.Interfaces;
using Common.Application.Paging;
using Moq;
using TrackHub.Manager.Infrastructure;
using TrackHub.Manager.Infrastructure.ManagerDB.Readers;

namespace Infrastructure.UnitTests;

/// <summary>
/// Cursor paging over the audit trail. The case that matters is a TIE: several events recorded in
/// the same instant. An offset page or a non-strict cursor either repeats them on the next page or
/// steps over them, and an audit trail that silently drops rows is worse than a slow one.
/// </summary>
[TestFixture]
public class AuditTrailKeysetPagingTests
{
    private static readonly Guid AccountId = Guid.NewGuid();
    private static readonly DateTimeOffset Instant = new(2026, 9, 17, 10, 0, 0, TimeSpan.Zero);

    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    private static ICurrentPrincipal Principal()
    {
        var principal = new Mock<ICurrentPrincipal>();
        principal.SetupGet(p => p.PrincipalType).Returns(PrincipalType.User);
        principal.SetupGet(p => p.AccountId).Returns(AccountId);
        principal.SetupGet(p => p.UserId).Returns(Guid.NewGuid());
        return principal.Object;
    }

    /// <summary>Ten events, all on the SAME instant, so ordering falls entirely to the id tiebreaker.</summary>
    private static ApplicationDbContext Seeded(string name, int count, bool tied)
    {
        var context = NewContext(name);

        for (var i = 0; i < count; i++)
        {
            var entity = new AuditEvent(
                AccountId, "User", $"actor-{i}", $"action-{i}", "Resource", $"{i}", "Succeeded",
                null, null, null, null, null, null);

            var entry = context.AuditEvents.Add(entity);
            // OccurredAt is stamped by the entity and has no public setter; EF owns the mapped value.
            entry.Property(e => e.OccurredAt).CurrentValue = tied ? Instant : Instant.AddMinutes(-i);
        }

        context.SaveChanges();
        return context;
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task EveryRowIsSeenExactlyOnceAcrossPages(bool tied)
    {
        using var context = Seeded($"audit-keyset-{tied}-{Guid.NewGuid()}", 10, tied);
        var reader = new AuditEventReader(context, Principal());

        var seen = new List<Guid>();
        string? cursor = null;

        for (var page = 0; page < 10; page++)
        {
            var result = await reader.GetAuditTrailAsync(AccountId, null, null, cursor, 3, CancellationToken.None);
            seen.AddRange(result.Items.Select(i => i.AuditEventId));

            if (!result.HasMore)
            {
                break;
            }

            cursor = result.NextCursor;
            Assert.That(cursor, Is.Not.Null, "a page that reports more rows must hand back a cursor");
        }

        Assert.Multiple(() =>
        {
            Assert.That(seen, Has.Count.EqualTo(10), "every row exactly once");
            Assert.That(seen.Distinct().Count(), Is.EqualTo(10), "no row returned twice");
        });
    }

    [Test]
    public async Task TheLastPageReportsNoMore()
    {
        using var context = Seeded($"audit-last-{Guid.NewGuid()}", 3, tied: false);
        var reader = new AuditEventReader(context, Principal());

        var page = await reader.GetAuditTrailAsync(AccountId, null, null, null, 3, CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(page.Items, Has.Count.EqualTo(3));
            Assert.That(page.HasMore, Is.False, "an exactly-full final page must not offer another");
        });
    }

    [Test]
    public async Task AnEmptyFeedHasNoCursor()
    {
        using var context = NewContext($"audit-empty-{Guid.NewGuid()}");
        var reader = new AuditEventReader(context, Principal());

        var page = await reader.GetAuditTrailAsync(AccountId, null, null, null, 50, CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(page.Items, Is.Empty);
            Assert.That(page.HasMore, Is.False);
            Assert.That(page.NextCursor, Is.Null);
        });
    }

    [Test]
    public async Task AGarbledCursorReadsAsTheStartOfTheFeed()
    {
        using var context = Seeded($"audit-garbled-{Guid.NewGuid()}", 5, tied: false);
        var reader = new AuditEventReader(context, Principal());

        var page = await reader.GetAuditTrailAsync(AccountId, null, null, "not-a-cursor", 50, CancellationToken.None);

        Assert.That(page.Items, Has.Count.EqualTo(5));
    }

    [Test]
    public void TheCursorCarriesTheLastRowOfThePage()
    {
        using var context = Seeded($"audit-cursor-{Guid.NewGuid()}", 5, tied: false);
        var reader = new AuditEventReader(context, Principal());

        var page = reader.GetAuditTrailAsync(AccountId, null, null, null, 2, CancellationToken.None).Result;

        Assert.That(FeedCursor.TryDecode(page.NextCursor, out var at, out var id), Is.True);
        Assert.Multiple(() =>
        {
            Assert.That(id, Is.EqualTo(page.Items.Last().AuditEventId));
            Assert.That(at, Is.EqualTo(page.Items.Last().OccurredAt));
        });
    }
}
