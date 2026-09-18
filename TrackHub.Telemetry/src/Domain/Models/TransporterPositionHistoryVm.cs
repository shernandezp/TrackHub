namespace TrackHub.Telemetry.Domain.Models;

public readonly record struct TransporterPositionHistoryVm(
    Guid TransporterPositionHistoryId,
    Guid AccountId,
    Guid OperatorId,
    Guid DeviceId,
    Guid TransporterId,
    DateTimeOffset SourceTimestamp,
    DateTimeOffset ReceivedAt,
    double Latitude,
    double Longitude,
    double? Altitude,
    double Speed,
    double? Course,
    int? EventId,
    string? Address,
    string? City,
    string? State,
    string? Country,
    string? Attributes,
    string IdempotencyKey);

/// <summary>
/// The history feed is append-only and unbounded, so it is paged by CURSOR and reports only whether
/// more rows exist. An exact count over it is a scan of the account's whole history.
/// </summary>
public readonly record struct TransporterPositionHistoryPageVm(
    IReadOnlyCollection<TransporterPositionHistoryVm> Items, bool HasMore, string? NextCursor);
