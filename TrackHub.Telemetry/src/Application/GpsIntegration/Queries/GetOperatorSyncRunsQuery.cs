using Common.Domain.Helpers;

namespace TrackHub.Telemetry.Application.GpsIntegration.Queries;

[Authorize(Resource = Resources.OperatorSyncRuns, Action = Actions.Read)]

public readonly record struct GetOperatorSyncRunsQuery(Guid? AccountId, Guid? OperatorId, int Take = 50) : IRequest<IReadOnlyCollection<OperatorSyncRunVm>>;

public class GetOperatorSyncRunsQueryHandler(IOperatorSyncRunReader reader)
    : IRequestHandler<GetOperatorSyncRunsQuery, IReadOnlyCollection<OperatorSyncRunVm>>
{
    public Task<IReadOnlyCollection<OperatorSyncRunVm>> Handle(GetOperatorSyncRunsQuery request, CancellationToken cancellationToken)
    {
        var dict = new Dictionary<string, object>();
        if (request.AccountId.HasValue) dict[nameof(OperatorSyncRunVm.AccountId)] = request.AccountId.Value;
        if (request.OperatorId.HasValue) dict[nameof(OperatorSyncRunVm.OperatorId)] = request.OperatorId.Value;
        return reader.GetAsync(new Filters(dict), request.Take, cancellationToken);
    }
}

// The report drains page this feed to the end of the window, so it takes the window at the source
// and pages by cursor with a unique tie-break instead of handing back the newest capped list.
[Authorize(Resource = Resources.OperatorSyncRuns, Action = Actions.Read)]
public readonly record struct GetOperatorSyncRunFeedQuery(
    Guid AccountId,
    Guid? OperatorId = null,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null,
    int Take = 500,
    string? Cursor = null) : IRequest<OperatorSyncRunPageVm>;

public class GetOperatorSyncRunFeedQueryHandler(IOperatorSyncRunReader reader)
    : IRequestHandler<GetOperatorSyncRunFeedQuery, OperatorSyncRunPageVm>
{
    public Task<OperatorSyncRunPageVm> Handle(GetOperatorSyncRunFeedQuery request, CancellationToken cancellationToken)
        => reader.GetFeedAsync(request.AccountId, request.OperatorId, request.From, request.To, request.Take, request.Cursor, cancellationToken);
}
