namespace TrackHub.Reporting.Domain.Models.Manager;

public readonly record struct ManagerTransporterPositionHistoryVm(
    Guid TransporterPositionHistoryId,
    Guid AccountId,
    Guid OperatorId,
    Guid DeviceId,
    Guid TransporterId,
    DateTimeOffset SourceTimestamp,
    DateTimeOffset ReceivedAt,
    double Latitude,
    double Longitude);

/// <summary>Telemetry pages this feed by cursor; the report reads one page and says whether it truncated.</summary>
public readonly record struct ManagerTransporterPositionHistoryPageVm(
    IReadOnlyCollection<ManagerTransporterPositionHistoryVm> Items, bool HasMore, string? NextCursor);
