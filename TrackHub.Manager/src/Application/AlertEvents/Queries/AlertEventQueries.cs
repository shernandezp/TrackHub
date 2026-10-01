namespace TrackHub.Manager.Application.AlertEvents.Queries;

[Authorize(Resource = Resources.Alerts, Action = Actions.Read)]
public readonly record struct GetAlertEventsQuery(
    Guid AccountId,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null,
    string? Status = null,
    string? Severity = null,
    string? SourceModule = null,
    IReadOnlyCollection<string>? EventTypes = null,
    int Skip = 0,
    int Take = 50) : IRequest<AlertEventsPageVm>;
public class GetAlertEventsQueryHandler(IAlertEventReader reader) : IRequestHandler<GetAlertEventsQuery, AlertEventsPageVm>
{
    public async Task<AlertEventsPageVm> Handle(GetAlertEventsQuery request, CancellationToken cancellationToken)
        => await reader.GetAlertEventsAsync(
            request.AccountId,
            new AlertEventFilter(request.From, request.To, request.Status, request.Severity, request.SourceModule, request.EventTypes),
            request.Skip,
            request.Take,
            cancellationToken);
}

// Open alerts per severity for the dashboard tile, over the same visibility as the list.
[Authorize(Resource = Resources.Alerts, Action = Actions.Read)]
public readonly record struct GetOpenAlertCountsQuery(Guid AccountId) : IRequest<IReadOnlyCollection<AlertSeverityCountVm>>;
public class GetOpenAlertCountsQueryHandler(IAlertEventReader reader) : IRequestHandler<GetOpenAlertCountsQuery, IReadOnlyCollection<AlertSeverityCountVm>>
{
    public async Task<IReadOnlyCollection<AlertSeverityCountVm>> Handle(GetOpenAlertCountsQuery request, CancellationToken cancellationToken)
        => await reader.CountOpenBySeverityAsync(request.AccountId, cancellationToken);
}
