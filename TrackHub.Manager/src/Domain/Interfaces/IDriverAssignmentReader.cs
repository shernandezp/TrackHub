namespace TrackHub.Manager.Domain.Interfaces;

public interface IDriverAssignmentReader
{
    Task<DriverAssignmentHistoryPageVm> GetDriverAssignmentHistoryAsync(Guid accountId, Guid? driverId, Guid? transporterId, DateTimeOffset? from, DateTimeOffset? to, int skip, int take, CancellationToken cancellationToken);
}
