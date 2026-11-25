using TrackHub.Telemetry.Domain.Models;

namespace TrackHub.Telemetry.Domain.Interfaces;

/// <summary>
/// Deliberately platform-scoped (unscoped) read — it does NOT go through
/// <c>AccountScopedDataAccess</c>; access is gated upstream by <c>[Authorize(OperatorSyncRuns, Read)]</c>.
/// </summary>
public interface IPlatformSyncActivityReader
{
    Task<PlatformSyncActivityVm> GetAsync(DateTimeOffset since, CancellationToken cancellationToken);
}
