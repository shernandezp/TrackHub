using Ardalis.GuardClauses;
using Common.Application.Interfaces;
using Common.Domain.Helpers;

namespace TrackHub.Telemetry.Application.GpsIntegration.Queries;

[Authorize(Resource = Resources.PositionHistory, Action = Actions.Read)]
[RequireFeature(FeatureKeys.GpsPositionHistory)]
public readonly record struct GetPositionHistoryQuery(
    Guid AccountId,
    Guid? TransporterId = null,
    Guid? DeviceId = null,
    int Take = 500,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null,
    string? Cursor = null) : IRequest<TransporterPositionHistoryPageVm>;

public class GetPositionHistoryQueryHandler(
    ITransporterPositionHistoryReader reader,
    IVisibleTransporterReader visibleReader,
    ICurrentPrincipal principal)
    : IRequestHandler<GetPositionHistoryQuery, TransporterPositionHistoryPageVm>
{
    public async Task<TransporterPositionHistoryPageVm> Handle(GetPositionHistoryQuery request, CancellationToken cancellationToken)
    {
        var dict = new Dictionary<string, object>
        {
            [nameof(TransporterPositionHistoryVm.AccountId)] = request.AccountId
        };
        if (request.TransporterId.HasValue) dict[nameof(TransporterPositionHistoryVm.TransporterId)] = request.TransporterId.Value;
        if (request.DeviceId.HasValue) dict[nameof(TransporterPositionHistoryVm.DeviceId)] = request.DeviceId.Value;

        // Same predicate as the replay read: a user sees the history of the transporters their
        // groups make visible (privileged roles read the account); an invisible id is NotFound.
        IReadOnlySet<Guid>? visible = null;
        if (principal.PrincipalType == PrincipalType.User && principal.UserId.HasValue)
        {
            visible = await visibleReader.GetVisibleTransporterIdsAsync(principal.UserId.Value, request.AccountId, cancellationToken);
            if (request.TransporterId.HasValue && !visible.Contains(request.TransporterId.Value))
            {
                throw new NotFoundException("Transporter", request.TransporterId.Value.ToString());
            }
        }

        return await reader.GetAsync(new Filters(dict), request.Take, request.From, request.To, request.Cursor, visible, cancellationToken);
    }
}
