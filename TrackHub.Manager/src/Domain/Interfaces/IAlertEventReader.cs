namespace TrackHub.Manager.Domain.Interfaces;

public interface IAlertEventReader
{
    Task<AlertEventsPageVm> GetAlertEventsAsync(Guid accountId, AlertEventFilter filter, int skip, int take, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<AlertSeverityCountVm>> CountOpenBySeverityAsync(Guid accountId, CancellationToken cancellationToken);
}
