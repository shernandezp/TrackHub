using TrackHub.Manager.Application.AuditEvents.Queries;

namespace TrackHub.Manager.Web.GraphQL.Query;

public partial class Query
{
    [GraphQLDeprecated("Use auditTrailFeed, which seeks by cursor instead of counting past rows. Removed after 2026-12-17.")]
    public async Task<IReadOnlyCollection<AuditEventVm>> GetAuditTrail([Service] ISender sender, [AsParameters] GetAuditTrailQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);

    public async Task<AuditEventPageVm> GetAuditTrailFeed([Service] ISender sender, [AsParameters] GetAuditTrailFeedQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);
}
