namespace TrackHub.Manager.Domain.Interfaces;

public interface IBackgroundJobRunReader
{
    Task<BackgroundJobRunsPageVm> GetBackgroundJobRunsAsync(Guid? accountId, DateTimeOffset? from, DateTimeOffset? to, int skip, int take, CancellationToken cancellationToken);
}
