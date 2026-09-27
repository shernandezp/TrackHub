using TrackHub.Telemetry.Domain.Enums;

namespace TrackHub.Telemetry.Domain.Models;

public readonly record struct OperatorSyncRunVm(
    Guid OperatorSyncRunId,
    Guid AccountId,
    Guid OperatorId,
    SyncTriggerType TriggerType,
    OperatorSyncResult Result,
    DateTimeOffset StartedAt,
    DateTimeOffset? CompletedAt,
    int DevicesSeen,
    int DevicesAdded,
    int DevicesUpdated,
    int DevicesRemoved,
    int DevicesIgnored,
    int PositionsRead,
    int PositionsAccepted,
    int PositionsRejected,
    string? ErrorCode,
    string? ErrorMessage,
    string? CorrelationId);

/// <summary>Cursor-paged sync runs, newest first, for drains that must see a whole window.</summary>
public readonly record struct OperatorSyncRunPageVm(IReadOnlyCollection<OperatorSyncRunVm> Items, bool HasMore, string? NextCursor);
