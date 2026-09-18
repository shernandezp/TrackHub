using TrackHub.Manager.Application.AuditEvents.Queries;

namespace TrackHub.Manager.Web.GraphQL.Query;

public partial class Query
{
    /// <summary>
    /// Superseded by <c>auditTrailFeed</c>. This one pages by OFFSET, which the database serves by
    /// walking and discarding every skipped row, and past a few thousand it abandons the ordered
    /// index scan and sorts the whole match set.
    /// </summary>
    [GraphQLDeprecated("Use auditTrailFeed, which seeks by cursor instead of counting past rows. Removed after 2026-12-17.")]
    public async Task<IReadOnlyCollection<AuditEventVm>> GetAuditTrail([Service] ISender sender, [AsParameters] GetAuditTrailQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);

    public async Task<AuditEventPageVm> GetAuditTrailFeed([Service] ISender sender, [AsParameters] GetAuditTrailFeedQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);
}
