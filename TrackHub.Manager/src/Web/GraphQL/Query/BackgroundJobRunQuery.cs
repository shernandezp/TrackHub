using TrackHub.Manager.Application.BackgroundJobs.Queries;

namespace TrackHub.Manager.Web.GraphQL.Query;

public partial class Query
{
    public async Task<BackgroundJobRunsPageVm> GetBackgroundJobRuns([Service] ISender sender, [AsParameters] GetBackgroundJobRunsQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);
}
