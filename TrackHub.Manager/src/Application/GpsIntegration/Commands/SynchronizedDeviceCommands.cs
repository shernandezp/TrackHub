using System.Text.Json;
using Common.Application.Paging;
using Microsoft.Extensions.Logging;

namespace TrackHub.Manager.Application.GpsIntegration.Commands;

[Authorize(Resource = Resources.SynchronizedDevices, Action = Actions.Write, PrincipalTypes = "User,ServiceClient")]
[AllowCrossAccount("SyncWorker's device-sync loop enumerates every account via accountSettingsMaster and pushes the synchronized device catalog per account under one global router_client/syncworker_client identity.")]
public readonly record struct SynchronizeOperatorDevicesCommand(
    Guid AccountId,
    Guid OperatorId,
    IReadOnlyCollection<DeviceDto> Devices,
    string CorrelationId,
    string TriggerType = "AUTOMATIC",
    bool? AutoAssignNewDevices = null) : IRequest<OperatorSyncRunVm>;

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
    IAlertEventWriter alertWriter,
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

        var existing = await deviceReader.GetDevicesByOperatorAsync(request.OperatorId, cancellationToken);
        var existingByIdentifier = existing
            .GroupBy(d => d.Identifier)
            .ToDictionary(g => g.Key, g => g.First());

        var incomingIdentifiers = new HashSet<int>();
        var newlyAdded = new List<DeviceDto>();
        var newlyAddedDevices = new List<(DeviceDto Incoming, DeviceVm Device)>();
        int added = 0, updated = 0, ignored = 0;

        // One unit of work for the whole catalog: per device this issued four round trips and its
        // own save, and a failure half way left the catalog partially written with no rollback.
        var upsertedDevices = await deviceWriter.UpsertSynchronizedDevicesAsync(
            request.OperatorId, request.Devices, cancellationToken);

        foreach (var (incoming, upserted) in request.Devices.Zip(upsertedDevices))
        {
            incomingIdentifiers.Add(incoming.Identifier);

            if (!existingByIdentifier.ContainsKey(incoming.Identifier))
            {
                added++;
                newlyAdded.Add(incoming);
                newlyAddedDevices.Add((incoming, upserted));
            }
            else
            {
                updated++;
            }

            if (upserted.DetectedStatus == DetectedStatus.Ignored)
                ignored++;
        }

        var removed = existingByIdentifier
            .Where(kvp => !incomingIdentifiers.Contains(kvp.Key))
            .Select(kvp => kvp.Value)
            .ToList();

        var autoAssign = default(AutoAssignOutcome);
        if (request.AutoAssignNewDevices ?? true)
        {
            autoAssign = await AutoAssignNewDevicesAsync(request.AccountId, newlyAddedDevices, cancellationToken);
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
                await alertWriter.RecordAlertEventAsync(new AlertEventDto(
                    request.AccountId,
                    EventType: "GpsDeviceDetected",
                    Severity: "Info",
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
                await alertWriter.RecordAlertEventAsync(new AlertEventDto(
                    request.AccountId,
                    EventType: "GpsDeviceRemoved",
                    Severity: "Warning",
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
                await alertWriter.RecordAlertEventAsync(new AlertEventDto(
                    request.AccountId,
                    EventType: "GpsDuplicateDeviceIdentifier",
                    Severity: "Warning",
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
                await alertWriter.RecordAlertEventAsync(new AlertEventDto(
                    request.AccountId,
                    EventType: "GpsAutoAssignGroupAmbiguous",
                    Severity: "Warning",
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
        }

        return new AutoAssignOutcome(provisioned, target.Ambiguous);
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
