using Common.Application.Interfaces;
using Common.Application.Paging;
using Common.Domain.Helpers;
using TrackHub.Telemetry.Domain.Enums;
using TrackHub.Telemetry.Domain.Models;
using TrackHub.Telemetry.Infrastructure.TelemetryDB.Interfaces;

namespace TrackHub.Telemetry.Infrastructure.TelemetryDB.Readers;

public sealed class OperatorSyncRunReader(IApplicationDbContext context, ICurrentPrincipal principal)
    : AccountScopedDataAccess(context, principal), IOperatorSyncRunReader
{
    public async Task<IReadOnlyCollection<OperatorSyncRunVm>> GetAsync(Filters filters, int take, CancellationToken cancellationToken)
    {
        var pageSize = Math.Clamp(take <= 0 ? 50 : take, 1, 500);
        var q = Context.OperatorSyncRuns.AsQueryable();
        q = filters.Apply(q);
        if (!CanAccessAllAccounts && Principal.AccountId.HasValue)
        {
            var acct = Principal.AccountId.Value;
            q = q.Where(x => x.AccountId == acct);
        }
        return await q.OrderByDescending(x => x.StartedAt).ThenByDescending(x => x.OperatorSyncRunId)
            .Take(pageSize)
            .Select(x => new OperatorSyncRunVm(x.OperatorSyncRunId, x.AccountId, x.OperatorId,
                (SyncTriggerType)x.TriggerType, (OperatorSyncResult)x.Result, x.StartedAt, x.CompletedAt,
                x.DevicesSeen, x.DevicesAdded, x.DevicesUpdated, x.DevicesRemoved, x.DevicesIgnored,
                x.PositionsRead, x.PositionsAccepted, x.PositionsRejected, x.ErrorCode, x.ErrorMessage, x.CorrelationId))
            .ToListAsync(cancellationToken);
    }

    public async Task<OperatorSyncRunPageVm> GetFeedAsync(Guid accountId, Guid? operatorId, DateTimeOffset? from, DateTimeOffset? to, int take, string? cursor, CancellationToken cancellationToken)
    {
        var scopedAccountId = RequireAccountAccess(accountId);
        var pageSize = Math.Clamp(take <= 0 ? 500 : take, 1, 500);
        var q = Context.OperatorSyncRuns.Where(x => x.AccountId == scopedAccountId);
        if (operatorId.HasValue)
        {
            q = q.Where(x => x.OperatorId == operatorId.Value);
        }
        if (from.HasValue)
        {
            q = q.Where(x => x.StartedAt >= from.Value);
        }
        if (to.HasValue)
        {
            q = q.Where(x => x.StartedAt <= to.Value);
        }

        if (FeedCursor.TryDecode(cursor, out var at, out var id))
        {
            q = q.Where(x => x.StartedAt < at || (x.StartedAt == at && x.OperatorSyncRunId.CompareTo(id) < 0));
        }

        var rows = await q.OrderByDescending(x => x.StartedAt)
            .ThenByDescending(x => x.OperatorSyncRunId)
            .Take(pageSize + 1)
            .Select(x => new OperatorSyncRunVm(x.OperatorSyncRunId, x.AccountId, x.OperatorId,
                (SyncTriggerType)x.TriggerType, (OperatorSyncResult)x.Result, x.StartedAt, x.CompletedAt,
                x.DevicesSeen, x.DevicesAdded, x.DevicesUpdated, x.DevicesRemoved, x.DevicesIgnored,
                x.PositionsRead, x.PositionsAccepted, x.PositionsRejected, x.ErrorCode, x.ErrorMessage, x.CorrelationId))
            .ToListAsync(cancellationToken);

        var hasMore = rows.Count > pageSize;
        var items = hasMore ? rows.GetRange(0, pageSize) : rows;
        return new OperatorSyncRunPageVm(
            items,
            hasMore,
            items.Count > 0 ? FeedCursor.Encode(items[^1].StartedAt, items[^1].OperatorSyncRunId) : null);
    }
}
