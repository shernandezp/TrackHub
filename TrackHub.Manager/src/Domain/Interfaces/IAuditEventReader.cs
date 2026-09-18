namespace TrackHub.Manager.Domain.Interfaces;

public interface IAuditEventReader
{
    Task<AuditEventPageVm> GetAuditTrailAsync(
        Guid accountId, DateTimeOffset? from, DateTimeOffset? to, string? cursor, int take, CancellationToken cancellationToken);

    /// <summary>
    /// The offset read behind the deprecated <c>auditTrail</c> field. O(offset): the database walks
    /// and discards every skipped row. Goes when the field does.
    /// </summary>
    Task<IReadOnlyCollection<AuditEventVm>> GetAuditTrailByOffsetAsync(
        Guid accountId, DateTimeOffset? from, DateTimeOffset? to, int skip, int take, CancellationToken cancellationToken);
}
