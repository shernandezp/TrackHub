using Common.Application.Interfaces;
using Common.Application.Paging;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Readers;

public sealed class AuditEventReader(IApplicationDbContext context, ICurrentPrincipal principal) : AccountScopedDataAccess(context, principal), IAuditEventReader
{
    private static int PageSize(int take) => Math.Clamp(take <= 0 ? 50 : take, 1, 500);

    public async Task<AuditEventPageVm> GetAuditTrailAsync(
        Guid accountId, DateTimeOffset? from, DateTimeOffset? to, string? cursor, int take, CancellationToken cancellationToken)
    {
        var scopedAccountId = RequireAccountAccess(accountId);
        var pageSize = PageSize(take);

        var query = Context.AuditEvents
            .Where(x => x.AccountId == scopedAccountId && (!from.HasValue || x.OccurredAt >= from) && (!to.HasValue || x.OccurredAt <= to));

        // Strict tuple comparison against the sort key, which ends on the unique id: the seek lands
        // exactly after the last row of the previous page even when several share an instant.
        if (FeedCursor.TryDecode(cursor, out var at, out var id))
        {
            query = query.Where(x => x.OccurredAt < at || (x.OccurredAt == at && x.AuditEventId.CompareTo(id) > 0));
        }

        // One row past the page: the only thing a reader needs to know is whether to offer "more".
        var rows = await query
            .OrderByDescending(x => x.OccurredAt).ThenBy(x => x.AuditEventId)
            .Take(pageSize + 1)
            .Select(x => new AuditEventVm(x.AuditEventId, x.AccountId, x.ActorType, x.ActorId, x.Action, x.ResourceType, x.ResourceId, x.Result, x.Reason, x.IpAddress, x.UserAgent, x.CorrelationId, x.OccurredAt))
            .ToListAsync(cancellationToken);

        var hasMore = rows.Count > pageSize;
        var items = hasMore ? rows.GetRange(0, pageSize) : rows;
        var last = items.Count > 0 ? items[^1] : default;

        return new AuditEventPageVm(
            items,
            hasMore,
            items.Count > 0 ? FeedCursor.Encode(last.OccurredAt, last.AuditEventId) : null);
    }

    public async Task<IReadOnlyCollection<AuditEventVm>> GetAuditTrailByOffsetAsync(
        Guid accountId, DateTimeOffset? from, DateTimeOffset? to, int skip, int take, CancellationToken cancellationToken)
    {
        var scopedAccountId = RequireAccountAccess(accountId);

        return await Context.AuditEvents
            .Where(x => x.AccountId == scopedAccountId && (!from.HasValue || x.OccurredAt >= from) && (!to.HasValue || x.OccurredAt <= to))
            .OrderByDescending(x => x.OccurredAt).ThenBy(x => x.AuditEventId)
            .Skip(Math.Max(0, skip)).Take(PageSize(take))
            .Select(x => new AuditEventVm(x.AuditEventId, x.AccountId, x.ActorType, x.ActorId, x.Action, x.ResourceType, x.ResourceId, x.Result, x.Reason, x.IpAddress, x.UserAgent, x.CorrelationId, x.OccurredAt))
            .ToListAsync(cancellationToken);
    }
}
