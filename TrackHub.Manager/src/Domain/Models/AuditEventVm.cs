namespace TrackHub.Manager.Domain.Models;

public readonly record struct AuditEventVm(Guid AuditEventId, Guid AccountId, string ActorType, string ActorId, string Action, string ResourceType, string ResourceId, string Result, string? Reason, string? IpAddress, string? UserAgent, string? CorrelationId, DateTimeOffset OccurredAt);

/// <summary>
/// The audit trail is append-only and unbounded, so it is paged by CURSOR and reports only whether
/// more rows exist. An exact count and an offset both cost O(rows) on a table nobody ever shrinks.
/// </summary>
public readonly record struct AuditEventPageVm(
    IReadOnlyCollection<AuditEventVm> Items, bool HasMore, string? NextCursor);
