using TrackHub.Telemetry.Domain.Models;
using TrackHub.Telemetry.Domain.Records;
using Common.Domain.Helpers;

namespace TrackHub.Telemetry.Domain.Interfaces;

public interface ITransporterPositionHistoryReader
{
    Task<TransporterPositionHistoryPageVm> GetAsync(Filters filters, int take, DateTimeOffset? from, DateTimeOffset? to, string? cursor, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<TransporterPositionHistoryVm>> GetRangeAsync(Guid accountId, Guid transporterId, DateTimeOffset from, DateTimeOffset to, int maxPoints, CancellationToken cancellationToken);
}
