using Microsoft.Extensions.Logging;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Services;

public sealed class AlertRecorder(IApplicationDbContext context, IAlertRuleEvaluator evaluator, ILogger<AlertRecorder> logger) : IAlertRecorder
{
    private const string Resolved = "Resolved";

    public async Task<AlertRecordResult> RecordAsync(AlertEventDto alertEvent, CancellationToken cancellationToken)
    {
        var result = await StoreAsync(alertEvent, cancellationToken);
        if (!result.NotifiesRules)
        {
            return result;
        }

        try
        {
            await evaluator.EvaluateAsync(result.Event, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested) { throw; }
        catch (Exception ex)
        {
            logger.LogError(ex, "Alert rule evaluation failed for alert event {AlertEventId}; the alert itself is recorded.", result.Event.AlertEventId);
        }

        return result;
    }

    public async Task<int> ResolveOpenAsync(Guid accountId, string resourceType, string resourceId, IReadOnlyCollection<string> eventTypes, CancellationToken cancellationToken)
    {
        var open = await context.AlertEvents
            .AsTracking()
            .Where(x => x.AccountId == accountId && x.ResourceType == resourceType && x.ResourceId == resourceId
                && x.Status != Resolved && eventTypes.Contains(x.EventType))
            .ToListAsync(cancellationToken);
        if (open.Count == 0)
        {
            return 0;
        }

        var now = DateTimeOffset.UtcNow;
        foreach (var alert in open)
        {
            alert.Status = Resolved;
            alert.LastSeenAt = now;
        }

        await context.SaveChangesAsync(cancellationToken);
        return open.Count;
    }

    private async Task<AlertRecordResult> StoreAsync(AlertEventDto alertEvent, CancellationToken cancellationToken)
    {
        var resolving = string.Equals(alertEvent.Status, Resolved, StringComparison.Ordinal);
        var open = await context.AlertEvents
            .AsTracking()
            .FirstOrDefaultAsync(x => x.AccountId == alertEvent.AccountId && x.DeduplicationKey == alertEvent.DeduplicationKey && x.Status != Resolved, cancellationToken);

        if (open is not null)
        {
            Touch(open, alertEvent.PayloadJson);
            if (resolving)
            {
                open.Status = Resolved;
            }

            await context.SaveChangesAsync(cancellationToken);
            return new(ToVm(open), resolving ? AlertTransition.Recovered : AlertTransition.Repeated);
        }

        // A recovery for something already closed (by a user or an earlier emission) records nothing new.
        if (resolving && await context.AlertEvents
                .FirstOrDefaultAsync(x => x.AccountId == alertEvent.AccountId && x.DeduplicationKey == alertEvent.DeduplicationKey, cancellationToken) is { } closed)
        {
            return new(ToVm(closed), AlertTransition.Ignored);
        }

        var entity = new AlertEvent(alertEvent.AccountId, alertEvent.EventType, alertEvent.Severity, alertEvent.SourceModule,
            alertEvent.ResourceType, alertEvent.ResourceId, alertEvent.Status, alertEvent.PayloadJson, alertEvent.DeduplicationKey);
        context.AlertEvents.Add(entity);

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsOpenAlertDuplicate(exception))
        {
            // Another emission won the insert; the filtered unique index is the real guard.
            context.ChangeTracker.Clear();
            var winner = await context.AlertEvents
                .AsTracking()
                .FirstAsync(x => x.AccountId == alertEvent.AccountId && x.DeduplicationKey == alertEvent.DeduplicationKey && x.Status != Resolved, cancellationToken);
            Touch(winner, alertEvent.PayloadJson);
            await context.SaveChangesAsync(cancellationToken);
            return new(ToVm(winner), AlertTransition.Repeated);
        }

        return new(ToVm(entity), AlertTransition.Opened);
    }

    private static void Touch(AlertEvent alert, string? payloadJson)
    {
        alert.LastSeenAt = DateTimeOffset.UtcNow;
        alert.PayloadJson = payloadJson;
    }

    private static bool IsOpenAlertDuplicate(DbUpdateException exception)
        => Common.Infrastructure.UniqueViolation.Matches(exception, "alert_events_open_dedup");

    private static AlertEventVm ToVm(AlertEvent x)
        => new(x.AlertEventId, x.AccountId, x.EventType, x.Severity, x.SourceModule, x.ResourceType, x.ResourceId, x.Status,
            x.FirstSeenAt, x.LastSeenAt, x.PayloadJson, x.DeduplicationKey, x.LastModified);
}
