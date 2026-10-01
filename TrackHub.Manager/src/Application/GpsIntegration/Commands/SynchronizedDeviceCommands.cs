using System.Text.Json;
using Common.Application.Paging;
using Microsoft.Extensions.Logging;
using TrackHub.Manager.Domain.Constants;

namespace TrackHub.Manager.Application.GpsIntegration.Commands;

[Authorize(Resource = Resources.SynchronizedDevices, Action = Actions.Write, PrincipalTypes = "User,ServiceClient")]
[AllowCrossAccount("SyncWorker's device-sync loop enumerates every account via accountSettingsMaster and pushes the synchronized device catalog per account under one global router_client/syncworker_client identity.")]
public readonly record struct SynchronizeOperatorDevicesCommand(
    Guid AccountId,
    Guid OperatorId,
    IReadOnlyCollection<DeviceDto> Devices,
    string CorrelationId,
    string TriggerType = "AUTOMATIC",
    bool? AutoAssignNewDevices = null,
    bool ResetDeviceCatalog = false) : IRequest<OperatorSyncRunVm>;

public class SynchronizeOperatorDevicesCommandHandler(
    IDeviceWriter deviceWriter,
    IDeviceReader deviceReader,
    ITransporterReader transporterReader,
    ITransporterWriter transporterWriter,
    ITransporterDeviceAssignmentWriter assignmentWriter,
    IGroupReader groupReader,
    IGroupWriter groupWriter,
    ITransporterGroupWriter transporterGroupWriter,
    IOperatorWriter operatorWriter,
    IAtomicWrite atomicWrite,
    IAlertRecorder alertRecorder,
    ILogger<SynchronizeOperatorDevicesCommandHandler> logger)
    : IRequestHandler<SynchronizeOperatorDevicesCommand, OperatorSyncRunVm>
{
    public async Task<OperatorSyncRunVm> Handle(SynchronizeOperatorDevicesCommand request, CancellationToken cancellationToken)
    {
        var startedAt = DateTimeOffset.UtcNow;
        if (request.Devices.Any(d => d.AccountId != request.AccountId || d.OperatorId != request.OperatorId))
        {
            throw new ForbiddenAccessException();
        }

        var newlyAdded = new List<DeviceDto>();
        var awaitingProvision = new List<(DeviceDto Incoming, DeviceVm Device)>();
        int added = 0, updated = 0, ignored = 0;

        // One unit of work for the whole catalog, retirements included; a device the provider lists
        // again comes back as Added and is re-assigned below rather than duplicated.
        var reconciliation = await deviceWriter.ReconcileSynchronizedDevicesAsync(
            request.OperatorId, request.Devices, request.ResetDeviceCatalog, cancellationToken);
        var addedIds = reconciliation.Added.Select(d => d.DeviceId).ToHashSet();

        foreach (var (incoming, upserted) in request.Devices.Zip(reconciliation.Devices))
        {
            if (addedIds.Contains(upserted.DeviceId))
            {
                added++;
                newlyAdded.Add(incoming);
            }
            else
            {
                updated++;
            }

            if (upserted.DetectedStatus == DetectedStatus.Ignored)
                ignored++;

            // Still New = never assigned nor ignored, whether it arrived now or an earlier provisioning
            // failed part-way: the state, not this run's diff, decides what is left to provision.
            if (upserted.DetectedStatus == DetectedStatus.New)
                awaitingProvision.Add((incoming, upserted));
        }

        var removed = reconciliation.Retired;

        var autoAssign = default(AutoAssignOutcome);
        if (request.AutoAssignNewDevices ?? true)
        {
            autoAssign = await AutoAssignNewDevicesAsync(request.AccountId, awaitingProvision, cancellationToken);
        }

        var duplicates = new List<(string Serial, Guid OtherOperatorId)>();
        if (newlyAdded.Count > 0)
        {
            var dupRows = await deviceReader.FindDuplicateSerialsAsync(
                request.AccountId,
                request.OperatorId,
                newlyAdded.Select(d => d.Serial).Where(s => !string.IsNullOrWhiteSpace(s)).ToArray(),
                cancellationToken);
            duplicates = dupRows.Select(d => (d.Serial, d.OperatorId)).ToList();
        }

        await EmitDeviceAlertsAsync(request, newlyAdded, removed, duplicates, autoAssign, cancellationToken);

        var finishedAt = DateTimeOffset.UtcNow;
        var triggerType = ResolveTriggerType(request.TriggerType);

        await operatorWriter.UpdateSyncSummaryAsync(request.OperatorId, finishedAt, triggerType, cancellationToken);

        // Manager no longer records the sync run: it returns the counts and Router is
        // the single writer of sync-run telemetry, recording exactly one run per attempt (success or
        // failure) with identical field completeness. OperatorSyncRunId is left empty because this VM
        // is not persisted here.
        return new OperatorSyncRunVm(
            OperatorSyncRunId: Guid.Empty,
            request.AccountId,
            request.OperatorId,
            triggerType,
            OperatorSyncResult.Succeeded,
            startedAt,
            finishedAt,
            request.Devices.Count,
            added,
            updated,
            removed.Count,
            ignored,
            PositionsRead: 0,
            PositionsAccepted: 0,
            PositionsRejected: 0,
            ErrorCode: null,
            ErrorMessage: null,
            request.CorrelationId);
    }

    private async Task EmitDeviceAlertsAsync(
        SynchronizeOperatorDevicesCommand request,
        IReadOnlyCollection<DeviceDto> newlyAdded,
        IReadOnlyCollection<DeviceVm> removed,
        IReadOnlyCollection<(string Serial, Guid OtherOperatorId)> duplicates,
        AutoAssignOutcome autoAssign,
        CancellationToken cancellationToken)
    {
        try
        {
            foreach (var device in newlyAdded)
            {
                // A device the provider lists again closes the alert its disappearance raised.
                await alertRecorder.ResolveOpenAsync(request.AccountId, "SynchronizedDevice", device.Identifier.ToString(), [AlertEventTypes.GpsDeviceRemoved], cancellationToken);
                await alertRecorder.RecordAsync(new AlertEventDto(
                    request.AccountId,
                    EventType: AlertEventTypes.GpsDeviceDetected,
                    Severity: AlertSeverities.Info,
                    SourceModule: "GpsIntegration",
                    ResourceType: "SynchronizedDevice",
                    ResourceId: device.Identifier.ToString(),
                    Status: "Open",
                    PayloadJson: JsonSerializer.Serialize(new { request.OperatorId, device.Identifier, device.Serial, request.CorrelationId }),
                    DeduplicationKey: $"gps-device-detected:{device.Identifier}:{request.OperatorId:N}"),
                    cancellationToken);
            }
            foreach (var device in removed)
            {
                await alertRecorder.RecordAsync(new AlertEventDto(
                    request.AccountId,
                    EventType: AlertEventTypes.GpsDeviceRemoved,
                    Severity: AlertSeverities.Warning,
                    SourceModule: "GpsIntegration",
                    ResourceType: "SynchronizedDevice",
                    ResourceId: device.Identifier.ToString(),
                    Status: "Open",
                    PayloadJson: JsonSerializer.Serialize(new { request.OperatorId, device.Identifier, device.Serial, request.CorrelationId }),
                    DeduplicationKey: $"gps-device-removed:{device.Identifier}:{request.OperatorId:N}"),
                    cancellationToken);
            }
            foreach (var (serial, otherOperatorId) in duplicates)
            {
                await alertRecorder.RecordAsync(new AlertEventDto(
                    request.AccountId,
                    EventType: AlertEventTypes.GpsDuplicateDeviceIdentifier,
                    Severity: AlertSeverities.Warning,
                    SourceModule: "GpsIntegration",
                    ResourceType: "SynchronizedDevice",
                    ResourceId: serial,
                    Status: "Open",
                    PayloadJson: JsonSerializer.Serialize(new { Serial = serial, ReportedBy = request.OperatorId, AlsoOwnedBy = otherOperatorId }),
                    DeduplicationKey: $"gps-duplicate-device:{serial}:{request.AccountId:N}"),
                    cancellationToken);
            }
            if (autoAssign is { Provisioned: > 0, Ambiguous: true })
            {
                await alertRecorder.RecordAsync(new AlertEventDto(
                    request.AccountId,
                    EventType: AlertEventTypes.GpsAutoAssignGroupAmbiguous,
                    Severity: AlertSeverities.Warning,
                    SourceModule: "GpsIntegration",
                    ResourceType: "Operator",
                    ResourceId: request.OperatorId.ToString(),
                    Status: "Open",
                    PayloadJson: JsonSerializer.Serialize(new { request.OperatorId, autoAssign.Provisioned, GroupMetadata.DefaultGroupName, request.CorrelationId }),
                    DeduplicationKey: $"gps-autoassign-group-ambiguous:{request.OperatorId:N}"),
                    cancellationToken);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex,
                "Failed to emit device sync alerts for operator {OperatorId}; the sync run itself is still recorded.",
                request.OperatorId);
        }
    }

    private async Task<AutoAssignOutcome> AutoAssignNewDevicesAsync(
        Guid accountId,
        IReadOnlyCollection<(DeviceDto Incoming, DeviceVm Device)> devices,
        CancellationToken cancellationToken)
    {
        if (devices.Count == 0)
        {
            return default;
        }

        var target = await AutoProvisionGroups.ResolveAsync(groupReader, groupWriter, accountId, cancellationToken);
        var provisioned = 0;

        foreach (var (incoming, device) in devices)
        {
            try
            {
                provisioned += await atomicWrite.RunAsync(
                    () => ProvisionAsync(accountId, incoming, device, target, cancellationToken),
                    cancellationToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // Rolled back whole, so the device stays New and the next sync provisions it again.
                logger.LogWarning(ex, "Provisioning device {DeviceId} failed; the next sync retries it.", device.DeviceId);
            }
        }

        return new AutoAssignOutcome(provisioned, target.Ambiguous);
    }

    private async Task<int> ProvisionAsync(
        Guid accountId,
        DeviceDto incoming,
        DeviceVm device,
        AutoProvisionGroupTarget target,
        CancellationToken cancellationToken)
    {
        var provisioned = 0;
        var name = ResolveTransporterName(incoming);

        // Adopt an existing same-name transporter with no active device before provisioning a
        // new one: a first sync against pre-existing data (re-onboarding, environment cutover)
        // must reconcile with the account's fleet, not clone it. An adopted transporter keeps
        // its group memberships — the account already manages its visibility.
        var adoptedId = await transporterReader.FindAdoptableTransporterAsync(accountId, name, cancellationToken);
        var transporterId = adoptedId ?? Guid.Empty;
        if (adoptedId is null)
        {
            var transporter = await transporterWriter.CreateTransporterAsync(
                new TransporterDto(
                    name,
                    ResolveTransporterTypeId(incoming.DeviceTypeId),
                    accountId),
                cancellationToken);
            transporterId = transporter.TransporterId;
            provisioned++;

            // Manual group management can move it later; the sync never moves it again.
            foreach (var groupId in target.GroupIds)
            {
                await transporterGroupWriter.CreateTransporterGroupAsync(
                    new TransporterGroupDto(transporterId, groupId),
                    cancellationToken);
            }
        }

        await assignmentWriter.AssignAsync(
            new TransporterDeviceAssignmentDto(
                accountId,
                transporterId,
                device.DeviceId,
                Priority: 0,
                IsPrimary: true,
                AssignmentReason: adoptedId is null
                    ? "Initial provider sync"
                    : "Initial provider sync (adopted existing transporter)"),
            cancellationToken);

        return provisioned;
    }

    private static string ResolveTransporterName(DeviceDto device)
        => FirstNonEmpty(device.ProviderDisplayName, device.Name, device.Serial, $"Device {device.Identifier}");

    private static string FirstNonEmpty(params string?[] values)
        => values.Select(v => v?.Trim()).FirstOrDefault(v => !string.IsNullOrWhiteSpace(v))!;

    private static short ResolveTransporterTypeId(short deviceTypeId)
        => (short)(Enum.IsDefined(typeof(Common.Domain.Enums.DeviceType), (int)deviceTypeId)
            ? (Common.Domain.Enums.DeviceType)deviceTypeId switch
            {
                Common.Domain.Enums.DeviceType.Aviation => Common.Domain.Enums.TransporterType.Aircraft,
                Common.Domain.Enums.DeviceType.Cycling => Common.Domain.Enums.TransporterType.Bicycle,
                Common.Domain.Enums.DeviceType.Drones => Common.Domain.Enums.TransporterType.Drone,
                Common.Domain.Enums.DeviceType.Marine => Common.Domain.Enums.TransporterType.Boat,
                Common.Domain.Enums.DeviceType.PetTracking => Common.Domain.Enums.TransporterType.Pet,
                Common.Domain.Enums.DeviceType.Phone or Common.Domain.Enums.DeviceType.Fitness or Common.Domain.Enums.DeviceType.Smartwatch or Common.Domain.Enums.DeviceType.Wearable => Common.Domain.Enums.TransporterType.Person,
                Common.Domain.Enums.DeviceType.OBDScanner => Common.Domain.Enums.TransporterType.FleetVehicle,
                _ => Common.Domain.Enums.TransporterType.Asset
            }
            : Common.Domain.Enums.TransporterType.Asset);

    private static SyncTriggerType ResolveTriggerType(string triggerType)
        => Enum.TryParse<SyncTriggerType>(triggerType, ignoreCase: true, out var parsed)
            ? parsed
            : SyncTriggerType.Automatic;
}
