using Common.Application.Paging;
using Microsoft.EntityFrameworkCore;
using NetTopologySuite.Geometries;
using TrackHub.TripManagement.Domain.Constants;
using TrackHub.TripManagement.Infrastructure.TripDB;
using TrackHub.TripManagement.Infrastructure.TripDB.Entities;
using TrackHub.TripManagement.Infrastructure.TripDB.Readers;

namespace Infrastructure.UnitTests;

/// <summary>
/// Cursor paging over a trip's event timeline. The case that matters is a TIE: detection writes
/// several events for the same instant (arrival plus the stop transitions it triggers), and an
/// offset page repeats or skips them once new events land at the head while someone is reading.
/// </summary>
[TestFixture]
public class TripTimelineKeysetPagingTests
{
    private static readonly Guid AccountId = Guid.NewGuid();
    private static readonly Guid TripId = Guid.NewGuid();
    private static readonly DateTimeOffset Instant = new(2026, 9, 17, 10, 0, 0, TimeSpan.Zero);

    private static ApplicationDbContext Seeded(int count, bool tied)
    {
        var context = new ApplicationDbContext(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"trip-timeline-{Guid.NewGuid()}")
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options);

        context.Trips.Add(new Trip
        {
            TripId = TripId,
            AccountId = AccountId,
            Code = "TRIP-0001",
            Status = TripStatuses.InProgress,
            TransporterId = Guid.NewGuid(),
            OriginName = "Depot",
            OriginPoint = new Point(-74.05, 4.65) { SRID = 4326 },
        });

        for (var i = 0; i < count; i++)
        {
            context.TripEvents.Add(new TripEvent
            {
                TripEventId = Guid.NewGuid(),
                AccountId = AccountId,
                TripId = TripId,
                EventType = $"event-{i}",
                OccurredAt = tied ? Instant : Instant.AddMinutes(-i),
                Source = TripEventSources.Portal,
                IdempotencyKey = $"key-{i}",
            });
        }

        context.SaveChanges();
        return context;
    }

    [TestCase(true)]
    [TestCase(false)]
    public async Task EveryEventIsSeenExactlyOnceAcrossPages(bool tied)
    {
        using var context = Seeded(10, tied);
        var reader = new TripReader(context, new AccountFeatureReader(context));

        var seen = new List<Guid>();
        string? cursor = null;

        for (var page = 0; page < 10; page++)
        {
            var result = await reader.GetTimelineAsync(TripId, AccountId, null, cursor, 3, CancellationToken.None);
            seen.AddRange(result.Items.Select(e => e.TripEventId));

            if (!result.HasMore)
            {
                break;
            }

            cursor = result.NextCursor;
            Assert.That(cursor, Is.Not.Null, "a page that reports more rows must hand back a cursor");
        }

        Assert.Multiple(() =>
        {
            Assert.That(seen, Has.Count.EqualTo(10), "every event exactly once");
            Assert.That(seen.Distinct().Count(), Is.EqualTo(10), "no event returned twice");
        });
    }

    [Test]
    public async Task AnExactlyFullFinalPageOffersNoMore()
    {
        using var context = Seeded(3, tied: false);
        var reader = new TripReader(context, new AccountFeatureReader(context));

        var page = await reader.GetTimelineAsync(TripId, AccountId, null, null, 3, CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(page.Items, Has.Count.EqualTo(3));
            Assert.That(page.HasMore, Is.False);
        });
    }

    [Test]
    public async Task TheCursorCarriesTheLastRowOfThePage()
    {
        using var context = Seeded(5, tied: false);
        var reader = new TripReader(context, new AccountFeatureReader(context));

        var page = await reader.GetTimelineAsync(TripId, AccountId, null, null, 2, CancellationToken.None);

        Assert.That(FeedCursor.TryDecode(page.NextCursor, out var at, out var id), Is.True);
        Assert.Multiple(() =>
        {
            Assert.That(id, Is.EqualTo(page.Items.Last().TripEventId));
            Assert.That(at, Is.EqualTo(page.Items.Last().OccurredAt));
        });
    }
}
