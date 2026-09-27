namespace TrackHub.Manager.Domain.Interfaces;

public interface IAlertEventWriter
{
    Task<AlertRecordResult> RecordAlertEventAsync(AlertEventDto alertEvent, CancellationToken cancellationToken);
    Task<int> ResolveAlertEventsAsync(Guid accountId, string resourceType, string resourceId, IReadOnlyCollection<string> eventTypes, CancellationToken cancellationToken);
    Task AcknowledgeAlertEventAsync(Guid alertEventId, CancellationToken cancellationToken);
    Task ResolveAlertEventAsync(Guid alertEventId, CancellationToken cancellationToken);
}
