using TrackHub.Telemetry.Application.GpsIntegration.Queries;

namespace TrackHub.Telemetry.Web.GraphQL.Query;

public partial class Query
{
    /// <summary>
    /// Superseded by <c>positionHistoryFeed</c>, which pages by cursor. Identical rows and identical
    /// cost — only the envelope differs — so a client can move at any time before this is removed.
    /// </summary>
    [GraphQLDeprecated("Use positionHistoryFeed, which reports hasMore and hands back a cursor. Removed after 2026-12-17.")]
    public async Task<IReadOnlyCollection<TransporterPositionHistoryVm>> GetPositionHistory(
        [Service] ISender sender, [AsParameters] GetPositionHistoryQuery query, CancellationToken cancellationToken)
        => (await sender.Send(query, cancellationToken)).Items;

    public async Task<TransporterPositionHistoryPageVm> GetPositionHistoryFeed(
        [Service] ISender sender, [AsParameters] GetPositionHistoryQuery query, CancellationToken cancellationToken)
        => await sender.Send(query, cancellationToken);

    public async Task<IReadOnlyCollection<TransporterPositionHistoryVm>> GetPositionHistoryRange([Service] ISender sender, [AsParameters] GetPositionHistoryRangeQuery query, CancellationToken cancellationToken)
        => await sender.Send(query, cancellationToken);
}
