namespace TrackHub.Manager.Domain.Interfaces;

/// <summary>
/// The one way an alert reaches the table: folds a repeat into the open row under its key, lets a
/// Resolved emission close that row, and runs the notification rules for what actually fired.
/// </summary>
public interface IAlertRecorder
{
    Task<AlertRecordResult> RecordAsync(AlertEventDto alertEvent, CancellationToken cancellationToken);

    /// <summary>Closes every open alert of the given types on one resource; returns how many.</summary>
    Task<int> ResolveOpenAsync(Guid accountId, string resourceType, string resourceId, IReadOnlyCollection<string> eventTypes, CancellationToken cancellationToken);
}
