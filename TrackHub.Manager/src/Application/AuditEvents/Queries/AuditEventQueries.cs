namespace TrackHub.Manager.Application.AuditEvents.Queries;

[Authorize(Resource = Resources.Audit, Action = Actions.Read)]
public readonly record struct GetAuditTrailFeedQuery(Guid AccountId, DateTimeOffset? From = null, DateTimeOffset? To = null, string? Cursor = null, int Take = 50) : IRequest<AuditEventPageVm>;
public class GetAuditTrailFeedQueryHandler(IAuditEventReader reader) : IRequestHandler<GetAuditTrailFeedQuery, AuditEventPageVm>
{
    public async Task<AuditEventPageVm> Handle(GetAuditTrailFeedQuery request, CancellationToken cancellationToken) => await reader.GetAuditTrailAsync(request.AccountId, request.From, request.To, request.Cursor, request.Take, cancellationToken);
}

/// <summary>Behind the deprecated <c>auditTrail</c> field. Goes when the field does.</summary>
[Authorize(Resource = Resources.Audit, Action = Actions.Read)]
public readonly record struct GetAuditTrailQuery(Guid AccountId, DateTimeOffset? From = null, DateTimeOffset? To = null, int Skip = 0, int Take = 50) : IRequest<IReadOnlyCollection<AuditEventVm>>;
public class GetAuditTrailQueryHandler(IAuditEventReader reader) : IRequestHandler<GetAuditTrailQuery, IReadOnlyCollection<AuditEventVm>>
{
    public async Task<IReadOnlyCollection<AuditEventVm>> Handle(GetAuditTrailQuery request, CancellationToken cancellationToken) => await reader.GetAuditTrailByOffsetAsync(request.AccountId, request.From, request.To, request.Skip, request.Take, cancellationToken);
}
