using TrackHub.Telemetry.Application.GpsIntegration.Queries;

namespace TrackHub.Telemetry.Web.GraphQL.Query;

public partial class Query
{
    public async Task<IReadOnlyCollection<OperatorSyncRunVm>> GetOperatorSyncRuns([Service] ISender sender, [AsParameters] GetOperatorSyncRunsQuery query, CancellationToken cancellationToken)
        => await sender.Send(query, cancellationToken);

    public async Task<OperatorSyncRunPageVm> GetOperatorSyncRunFeed([Service] ISender sender, [AsParameters] GetOperatorSyncRunFeedQuery query, CancellationToken cancellationToken)
        => await sender.Send(query, cancellationToken);
}
