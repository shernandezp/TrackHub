using Common.Application.Exceptions;
using Common.Application.Interfaces;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Writers;

public sealed class AlertEventWriter(IApplicationDbContext context, ICurrentPrincipal principal) : AccountScopedDataAccess(context, principal), IAlertEventWriter
{
    public async Task<AlertEventVm> RecordAlertEventAsync(AlertEventDto alertEvent, CancellationToken cancellationToken)
    {
        var accountId = RequireAccountWriteAccess(alertEvent.AccountId);
        await RequireResourceInAccountAsync(accountId, alertEvent.ResourceType, alertEvent.ResourceId, cancellationToken);
        var entity = await Context.AlertEvents
            .AsTracking().FirstOrDefaultAsync(x => x.AccountId == accountId && x.DeduplicationKey == alertEvent.DeduplicationKey && x.Status != "Resolved", cancellationToken);
        if (entity == null)
        {
            entity = new AlertEvent(accountId, alertEvent.EventType, alertEvent.Severity, alertEvent.SourceModule, alertEvent.ResourceType, alertEvent.ResourceId, alertEvent.Status, alertEvent.PayloadJson, alertEvent.DeduplicationKey);
            await Context.AlertEvents.AddAsync(entity, cancellationToken);
        }
        else
        {
            entity.LastSeenAt = DateTimeOffset.UtcNow;
            entity.PayloadJson = alertEvent.PayloadJson;
        }

        try
        {
            await Context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsOpenAlertDuplicate(exception))
        {
            // Another emission won the insert. The filtered unique index is the real guard; fold
            // into the row it created rather than failing an alert nobody asked to be unique-checked.
            foreach (var entry in Context.ChangeTracker.Entries().ToList())
            {
                entry.State = EntityState.Detached;
            }

            var winner = await Context.AlertEvents
                .AsTracking()
                .FirstAsync(x => x.AccountId == accountId && x.DeduplicationKey == alertEvent.DeduplicationKey && x.Status != "Resolved", cancellationToken);

            winner.LastSeenAt = DateTimeOffset.UtcNow;
            winner.PayloadJson = alertEvent.PayloadJson;
            await Context.SaveChangesAsync(cancellationToken);
            return ToVm(winner);
        }

        return ToVm(entity);
    }

    private static bool IsOpenAlertDuplicate(DbUpdateException exception)
        => exception.InnerException is Npgsql.PostgresException postgres
            && string.Equals(postgres.SqlState, "23505", StringComparison.Ordinal)
            && postgres.ConstraintName?.Contains("alert_events_open_dedup", StringComparison.OrdinalIgnoreCase) == true;

    public async Task AcknowledgeAlertEventAsync(Guid alertEventId, CancellationToken cancellationToken) => await UpdateStatusAsync(alertEventId, "Acknowledged", cancellationToken);
    public async Task ResolveAlertEventAsync(Guid alertEventId, CancellationToken cancellationToken) => await UpdateStatusAsync(alertEventId, "Resolved", cancellationToken);

    private async Task UpdateStatusAsync(Guid alertEventId, string status, CancellationToken cancellationToken)
    {
        var entity = await Context.AlertEvents
            .AsTracking().FirstAsync(x => x.AlertEventId == alertEventId, cancellationToken);
        RequireAccountWriteAccess(entity.AccountId);
        entity.Status = status;
        await Context.SaveChangesAsync(cancellationToken);
    }

    // The source resource must belong to the event's account. Resource types without a
    // mapping in this context (e.g. Geofence, owned by the Geofencing service) pass through.
    //
    // DESIGN NOTE — "Trip" (spec 11 §12) deliberately falls through the `_ => true` default and MUST
    // NOT be "fixed" into a cross-service call. Manager does not store trips, so verifying one would
    // mean calling TripManagement from Manager, inverting the dependency direction for every alert
    // write. The check is not load-bearing here: the emitter is a trusted service identity
    // (`trip_client`) that has already resolved the trip and its account before emitting. The same
    // reasoning already covers "Geofence". Only resource types Manager actually owns get verified.
    private async Task RequireResourceInAccountAsync(Guid accountId, string resourceType, string resourceId, CancellationToken cancellationToken)
    {
        var belongs = resourceType switch
        {
            "Transporter" => Guid.TryParse(resourceId, out var transporterId)
                && await Context.Transporters.AnyAsync(x => x.TransporterId == transporterId && x.AccountId == accountId, cancellationToken),
            "Operator" => Guid.TryParse(resourceId, out var operatorId)
                && await Context.Operators.AnyAsync(x => x.OperatorId == operatorId && x.AccountId == accountId, cancellationToken),
            "Document" => Guid.TryParse(resourceId, out var documentId)
                && await Context.Documents.AnyAsync(x => x.DocumentId == documentId && x.AccountId == accountId, cancellationToken),
            "Driver" => Guid.TryParse(resourceId, out var driverId)
                && await Context.Drivers.AnyAsync(x => x.DriverId == driverId && x.AccountId == accountId, cancellationToken),
            _ => true
        };

        if (!belongs)
        {
            throw new ForbiddenAccessException($"Alert source resource {resourceType} {resourceId} does not belong to account {accountId}.");
        }
    }

    private static AlertEventVm ToVm(AlertEvent x) => new(x.AlertEventId, x.AccountId, x.EventType, x.Severity, x.SourceModule, x.ResourceType, x.ResourceId, x.Status, x.FirstSeenAt, x.LastSeenAt, x.PayloadJson, x.DeduplicationKey, x.LastModified);
}
