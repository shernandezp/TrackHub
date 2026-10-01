using TrackHub.Manager.Domain.Constants;
using Common.Application.Interfaces;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Readers;

public sealed class AlertEventReader(IApplicationDbContext context, ICurrentPrincipal principal, IVisibleTransporterReader visibleTransporters) : AccountScopedDataAccess(context, principal), IAlertEventReader
{
    private static int PageSize(int take) => Math.Clamp(take <= 0 ? 50 : take, 1, 500);
    private static int Offset(int skip) => Math.Max(0, skip);

    public async Task<AlertEventsPageVm> GetAlertEventsAsync(Guid accountId, AlertEventFilter filter, int skip, int take, CancellationToken cancellationToken)
    {
        var query = (await VisibleEventsAsync(accountId, cancellationToken))
            .Where(x => (!filter.From.HasValue || x.LastSeenAt >= filter.From) && (!filter.To.HasValue || x.FirstSeenAt <= filter.To));
        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = query.Where(x => x.Status == filter.Status);
        }
        if (!string.IsNullOrWhiteSpace(filter.Severity))
        {
            query = query.Where(x => x.Severity == filter.Severity);
        }
        if (!string.IsNullOrWhiteSpace(filter.SourceModule))
        {
            query = query.Where(x => x.SourceModule == filter.SourceModule);
        }
        if (filter.EventTypes is { Count: > 0 } eventTypes)
        {
            query = query.Where(x => eventTypes.Contains(x.EventType));
        }

        // FirstSeenAt, not LastSeenAt: a repeat folds into the open row and moves LastSeenAt, which
        // would shuffle rows between pages while an operator is paging.
        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(x => x.FirstSeenAt).ThenBy(x => x.AlertEventId)
            .Skip(Offset(skip)).Take(PageSize(take))
            .Select(x => new AlertEventVm(x.AlertEventId, x.AccountId, x.EventType, x.Severity, x.SourceModule, x.ResourceType, x.ResourceId, x.Status, x.FirstSeenAt, x.LastSeenAt, x.PayloadJson, x.DeduplicationKey, x.LastModified, null))
            .ToListAsync(cancellationToken);
        return new AlertEventsPageVm(await WithResourceNamesAsync(items, cancellationToken), totalCount);
    }

    public async Task<IReadOnlyCollection<AlertSeverityCountVm>> CountOpenBySeverityAsync(Guid accountId, CancellationToken cancellationToken)
        => await (await VisibleEventsAsync(accountId, cancellationToken))
            .Where(x => x.Status == AlertStatuses.Open)
            .GroupBy(x => x.Severity)
            .Select(g => new AlertSeverityCountVm(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

    // The unit or operator an alert is about, by name, so the list never shows a bare id.
    private async Task<IReadOnlyCollection<AlertEventVm>> WithResourceNamesAsync(List<AlertEventVm> items, CancellationToken cancellationToken)
    {
        var ids = items
            .Where(x => x.ResourceType is "Transporter" or "Operator")
            .Select(x => Guid.TryParse(x.ResourceId, out var id) ? id : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();
        if (ids.Count == 0)
        {
            return items;
        }

        var names = await Context.Transporters.Where(t => ids.Contains(t.TransporterId)).Select(t => new { Id = t.TransporterId, t.Name })
            .Concat(Context.Operators.Where(o => ids.Contains(o.OperatorId)).Select(o => new { Id = o.OperatorId, o.Name }))
            .ToDictionaryAsync(x => x.Id.ToString(), x => x.Name, cancellationToken);

        return items.Select(x => names.TryGetValue(x.ResourceId, out var name) ? x with { ResourceName = name } : x).ToList();
    }

    private async Task<IQueryable<Entities.AlertEvent>> VisibleEventsAsync(Guid accountId, CancellationToken cancellationToken)
    {
        var scopedAccountId = RequireAccountAccess(accountId);
        var query = Context.AlertEvents.Where(x => x.AccountId == scopedAccountId);

        // Alert-feed visibility follows the source resource: non-privileged users see
        // transporter-mapped events for their group-visible transporters only; events without a
        // group-mappable resource (account-level events such as credential expiry) stay visible to
        // administrators/managers only.
        if (!IsPrivileged)
        {
            if (Principal.PrincipalType != PrincipalType.User || !Principal.UserId.HasValue)
            {
                return query.Where(_ => false);
            }

            var visibleIds = await visibleTransporters.GetVisibleTransporterIdsAsync(Principal.UserId.Value, scopedAccountId, cancellationToken);
            var visibleKeys = visibleIds.Select(id => id.ToString()).ToList();
            query = query.Where(x => x.ResourceType == "Transporter" && visibleKeys.Contains(x.ResourceId));
        }

        return query;
    }
}
