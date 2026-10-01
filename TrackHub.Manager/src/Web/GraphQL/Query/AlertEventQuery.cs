using TrackHub.Manager.Application.AlertEvents.Queries;

namespace TrackHub.Manager.Web.GraphQL.Query;

public partial class Query
{
    public async Task<AlertEventsPageVm> GetAlertEvents([Service] ISender sender, [AsParameters] GetAlertEventsQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);
    public async Task<IReadOnlyCollection<AlertSeverityCountVm>> GetOpenAlertCounts([Service] ISender sender, [AsParameters] GetOpenAlertCountsQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);
}
