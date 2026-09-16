using Common.Application.Interfaces;
using Common.Domain.Helpers;
using TrackHub.Telemetry.Domain.Models;
using TrackHub.Telemetry.Infrastructure.TelemetryDB.Interfaces;

namespace TrackHub.Telemetry.Infrastructure.TelemetryDB.Readers;

public sealed class TransporterPositionHistoryReader(IApplicationDbContext context, ICurrentPrincipal principal)
    : AccountScopedDataAccess(context, principal), ITransporterPositionHistoryReader
{
    public async Task<IReadOnlyCollection<TransporterPositionHistoryVm>> GetAsync(Filters filters, int take, DateTimeOffset? from, DateTimeOffset? to, CancellationToken cancellationToken)
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
        return await q.OrderByDescending(x => x.SourceTimestamp)
            .Take(pageSize)
            .Select(x => new TransporterPositionHistoryVm(x.TransporterPositionHistoryId, x.AccountId, x.OperatorId, x.DeviceId, x.TransporterId,
                x.SourceTimestamp, x.ReceivedAt, x.Latitude, x.Longitude, x.Altitude, x.Speed, x.Course, x.EventId,
                x.Address, x.City, x.State, x.Country, x.Attributes, x.IdempotencyKey))
            .ToListAsync(cancellationToken);
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
