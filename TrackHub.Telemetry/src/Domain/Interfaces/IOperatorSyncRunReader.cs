using TrackHub.Telemetry.Domain.Models;
using TrackHub.Telemetry.Domain.Records;
using Common.Domain.Helpers;

namespace TrackHub.Telemetry.Domain.Interfaces;

public interface IOperatorSyncRunReader
{
    Task<IReadOnlyCollection<OperatorSyncRunVm>> GetAsync(Filters filters, int take, CancellationToken cancellationToken);
    Task<OperatorSyncRunPageVm> GetFeedAsync(Guid accountId, Guid? operatorId, DateTimeOffset? from, DateTimeOffset? to, int take, string? cursor, CancellationToken cancellationToken);
}
