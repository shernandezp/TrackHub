using Common.Application.Interfaces;
using Common.Application.Paging;
using Common.Domain.Helpers;
using TrackHub.Telemetry.Domain.Models;
using TrackHub.Telemetry.Infrastructure.TelemetryDB.Interfaces;

namespace TrackHub.Telemetry.Infrastructure.TelemetryDB.Readers;

public sealed class TransporterPositionHistoryReader(IApplicationDbContext context, ICurrentPrincipal principal)
    : AccountScopedDataAccess(context, principal), ITransporterPositionHistoryReader
{
    public async Task<TransporterPositionHistoryPageVm> GetAsync(Filters filters, int take, DateTimeOffset? from, DateTimeOffset? to, string? cursor, CancellationToken cancellationToken)
    {
        var pageSize = Math.Clamp(take <= 0 ? 100 : take, 1, 1000);
        var q = Context.TransporterPositionHistory.AsQueryable();
        q = filters.Apply(q);

        // Bounded in SQL. Applied after a newest-first Take, the window intersected only the most
        // recent page, so an export of an older month came back near-empty on an active fleet.
        if (from.HasValue)
        {
            q = q.Where(x => x.SourceTimestamp >= from.Value);
        }

        if (to.HasValue)
        {
            q = q.Where(x => x.SourceTimestamp <= to.Value);
        }

        if (!CanAccessAllAccounts && Principal.AccountId.HasValue)
        {
            var acct = Principal.AccountId.Value;
            q = q.Where(x => x.AccountId == acct);
        }

        // Strict tuple comparison against the sort key, which ends on the unique id: the seek lands
        // exactly after the last row of the previous page even when several share an instant.
        if (FeedCursor.TryDecode(cursor, out var at, out var id))
        {
            q = q.Where(x => x.SourceTimestamp < at
                || (x.SourceTimestamp == at && x.TransporterPositionHistoryId.CompareTo(id) < 0));
        }

        // One row past the page: the only thing a reader needs to know is whether to offer "more".
        var rows = await q.OrderByDescending(x => x.SourceTimestamp)
            .ThenByDescending(x => x.TransporterPositionHistoryId)
            .Take(pageSize + 1)
            .Select(x => new TransporterPositionHistoryVm(x.TransporterPositionHistoryId, x.AccountId, x.OperatorId, x.DeviceId, x.TransporterId,
                x.SourceTimestamp, x.ReceivedAt, x.Latitude, x.Longitude, x.Altitude, x.Speed, x.Course, x.EventId,
                x.Address, x.City, x.State, x.Country, x.Attributes, x.IdempotencyKey))
            .ToListAsync(cancellationToken);

        var hasMore = rows.Count > pageSize;
        var items = hasMore ? rows.GetRange(0, pageSize) : rows;

        return new TransporterPositionHistoryPageVm(
            items,
            hasMore,
            items.Count > 0 ? FeedCursor.Encode(items[^1].SourceTimestamp, items[^1].TransporterPositionHistoryId) : null);
    }

    // Replay read: ascending by SourceTimestamp, strictly within [from, to], capped by maxPoints.
    public async Task<IReadOnlyCollection<TransporterPositionHistoryVm>> GetRangeAsync(Guid accountId, Guid transporterId, DateTimeOffset from, DateTimeOffset to, int maxPoints, CancellationToken cancellationToken)
    {
        var scopedAccountId = RequireAccountAccess(accountId);

        return await Context.TransporterPositionHistory
            .Where(x => x.AccountId == scopedAccountId
                && x.TransporterId == transporterId
                && x.SourceTimestamp >= from
                && x.SourceTimestamp <= to)
            .OrderBy(x => x.SourceTimestamp)
            .Take(maxPoints)
            .Select(x => new TransporterPositionHistoryVm(x.TransporterPositionHistoryId, x.AccountId, x.OperatorId, x.DeviceId, x.TransporterId,
                x.SourceTimestamp, x.ReceivedAt, x.Latitude, x.Longitude, x.Altitude, x.Speed, x.Course, x.EventId,
                x.Address, x.City, x.State, x.Country, x.Attributes, x.IdempotencyKey))
            .ToListAsync(cancellationToken);
    }
}
