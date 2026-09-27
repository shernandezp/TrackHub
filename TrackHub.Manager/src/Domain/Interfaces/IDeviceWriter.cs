using TrackHub.Manager.Domain.Records;

namespace TrackHub.Manager.Domain.Interfaces;

public interface IDeviceWriter
{
    /// <summary>Upserts a whole provider catalog in one unit of work.</summary>
    Task<DeviceReconciliationVm> ReconcileSynchronizedDevicesAsync(Guid operatorId, IReadOnlyCollection<DeviceDto> devices, bool resetDeviceCatalog, CancellationToken cancellationToken);
    // Manual registration for providers without a device-catalog API (Prosegur).
    Task<DeviceVm> CreateManualDeviceAsync(DeviceDto deviceDto, CancellationToken cancellationToken);
    Task SetDetectedStatusAsync(Guid deviceId, DetectedStatus status, CancellationToken cancellationToken);
    Task DeleteDeviceAsync(Guid deviceId, CancellationToken cancellationToken);
}
