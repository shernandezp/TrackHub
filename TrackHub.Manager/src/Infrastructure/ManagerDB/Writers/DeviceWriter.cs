using Common.Application.Exceptions;
using Common.Application.Interfaces;
using Common.Domain.Enums;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Writers;

public sealed class DeviceWriter(IApplicationDbContext context, ICurrentPrincipal principal)
    : AccountScopedDataAccess(context, principal), IDeviceWriter
{
    /// <summary>
    /// Upserts a whole provider catalog in ONE unit of work: the operator is validated once, the
    /// operator's devices are loaded once, every row is mutated in memory, and a single summary
    /// audit event is written. Per-device it issued an operator lookup, a device lookup, an audit
    /// row and its own SaveChangesAsync — roughly 3 000 round trips and 2 000 audit rows for a
    /// 1 000-device operator, with no rollback if it failed half way.
    /// </summary>
    public async Task<IReadOnlyList<DeviceVm>> UpsertSynchronizedDevicesAsync(
        Guid operatorId, IReadOnlyCollection<DeviceDto> devices, CancellationToken cancellationToken)
    {
        if (devices.Count == 0)
        {
            return [];
        }

        var accountId = RequireAccountWriteAccess(devices.First().AccountId);
        var operatorAccountId = await Context.Operators
            .Where(o => o.OperatorId == operatorId)
            .Select(o => (Guid?)o.AccountId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException(nameof(Entities.Operator), operatorId.ToString());

        if (operatorAccountId != accountId)
        {
            throw new ForbiddenAccessException();
        }

        var identifiers = devices.Select(d => d.Identifier).Distinct().ToList();
        var existingByIdentifier = await Context.Devices
            .AsTracking()
            .Where(d => d.AccountId == accountId && d.OperatorId == operatorId && identifiers.Contains(d.Identifier))
            .ToDictionaryAsync(d => d.Identifier, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var results = new List<DeviceVm>(devices.Count);
        var createdCount = 0;

        foreach (var deviceDto in devices)
        {
            Entities.Device device;
            if (existingByIdentifier.TryGetValue(deviceDto.Identifier, out var existing))
            {
                Apply(existing, deviceDto, now);
                device = existing;
            }
            else
            {
                device = NewSynchronizedDevice(deviceDto, accountId, now);
                await Context.Devices.AddAsync(device, cancellationToken);
                existingByIdentifier[deviceDto.Identifier] = device;
                createdCount++;
            }

            results.Add(ToVm(device));
        }

        AddAuditEvent(accountId, "SynchronizedDevice.Synced", "SynchronizedDevice", operatorId.ToString(), null,
            $"{{\"devices\":{devices.Count},\"created\":{createdCount}}}");

        await Context.SaveChangesAsync(cancellationToken);

        return results;
    }

    private static Entities.Device NewSynchronizedDevice(DeviceDto deviceDto, Guid accountId, DateTimeOffset now)
        => new(
            deviceDto.Name,
            deviceDto.Identifier,
            deviceDto.Serial,
            deviceDto.DeviceTypeId,
            deviceDto.Description,
            deviceDto.ProviderDisplayName,
            deviceDto.ProviderMetadataHash,
            deviceDto.ProviderStatus,
            (int)DetectedStatus.New,
            deviceDto.OperatorId,
            accountId)
        {
            FirstSeenAt = now,
            LastSeenAt = now,
            LastSyncedAt = now
        };

    private static void Apply(Entities.Device existing, DeviceDto deviceDto, DateTimeOffset now)
    {
        existing.Name = deviceDto.Name;
        existing.Identifier = deviceDto.Identifier;
        existing.Serial = deviceDto.Serial;
        existing.DeviceTypeId = deviceDto.DeviceTypeId;
        existing.Description = deviceDto.Description;
        existing.ProviderDisplayName = deviceDto.ProviderDisplayName;
        existing.ProviderMetadataHash = deviceDto.ProviderMetadataHash;
        existing.ProviderStatus = deviceDto.ProviderStatus;
        existing.LastSeenAt = now;
        existing.LastSyncedAt = now;
        if (existing.DetectedStatus == (int)DetectedStatus.New)
        {
            existing.DetectedStatus = (int)DetectedStatus.Available;
        }
    }

    private static DeviceVm ToVm(Entities.Device device)
        => new(
            device.DeviceId,
            device.AccountId,
            device.OperatorId,
            device.Serial,
            device.Name,
            device.Identifier,
            device.ProviderDisplayName,
            (DeviceType)device.DeviceTypeId,
            device.DeviceTypeId,
            device.Description,
            device.ProviderMetadataHash,
            device.ProviderStatus,
            (DetectedStatus)device.DetectedStatus,
            device.FirstSeenAt,
            device.LastSeenAt,
            device.LastSyncedAt,
            device.LastAssignedAt,
            device.IgnoredAt);

    private const int MaxIdentifierAllocationRetries = 3;

    private async Task<int> NextIdentifierAsync(Guid accountId, Guid operatorId, CancellationToken cancellationToken)
        => (await Context.Devices
            .Where(d => d.AccountId == accountId && d.OperatorId == operatorId)
            .MaxAsync(d => (int?)d.Identifier, cancellationToken) ?? 0) + 1;

    // Manual registration for providers without a device-catalog API (Prosegur) —
    // sync can never discover their devices, so operators enter them by hand.
    public async Task<DeviceVm> CreateManualDeviceAsync(DeviceDto deviceDto, CancellationToken cancellationToken)
    {
        var accountId = RequireAccountWriteAccess(deviceDto.AccountId);
        var operatorAccountId = await Context.Operators
            .Where(o => o.OperatorId == deviceDto.OperatorId)
            .Select(o => (Guid?)o.AccountId)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new NotFoundException(nameof(Entities.Operator), deviceDto.OperatorId.ToString());
        if (operatorAccountId != accountId)
        {
            throw new ForbiddenAccessException();
        }

        var allocated = deviceDto.Identifier <= 0;
        var identifier = deviceDto.Identifier;
        if (allocated)
        {
            identifier = await NextIdentifierAsync(accountId, deviceDto.OperatorId, cancellationToken);
        }
        else
        {
            var taken = await Context.Devices.AnyAsync(
                d => d.AccountId == accountId
                    && d.OperatorId == deviceDto.OperatorId
                    && d.Identifier == identifier,
                cancellationToken);
            if (taken)
            {
                throw new ConflictException($"A device with identifier {identifier} already exists for this operator.");
            }
        }

        var now = DateTimeOffset.UtcNow;
        var device = new Entities.Device(
            deviceDto.Name,
            identifier,
            deviceDto.Serial,
            deviceDto.DeviceTypeId,
            deviceDto.Description,
            // A manually registered device has no provider catalog behind it, so it carries no
            // provider metadata — ignore any client-supplied values rather than persist (and
            // risk over-length) fields that only the sync path legitimately fills.
            providerDisplayName: null,
            providerMetadataHash: null,
            providerStatus: null,
            (int)DetectedStatus.New,
            deviceDto.OperatorId,
            accountId)
        {
            FirstSeenAt = now,
            LastSeenAt = now,
            LastSyncedAt = now
        };
        await Context.Devices.AddAsync(device, cancellationToken);

        AddAuditEvent(accountId, "SynchronizedDevice.CreatedManually",
            "SynchronizedDevice", device.DeviceId.ToString(), null, null);
        // The unique (account, operator, identifier) index is the real guarantee; the pre-check is
        // only a friendlier message. An ALLOCATED identifier retries on a collision — manual
        // registration allocates every time, so two concurrent registrations are ordinary and must
        // not surface as a conflict the operator cannot act on.
        for (var attempt = 0; ; attempt++)
        {
            try
            {
                await Context.SaveChangesAsync(cancellationToken);
                break;
            }
            catch (DbUpdateException) when (allocated && attempt < MaxIdentifierAllocationRetries)
            {
                identifier = await NextIdentifierAsync(accountId, deviceDto.OperatorId, cancellationToken);
                device.Identifier = identifier;
            }
            catch (DbUpdateException)
            {
                Context.Devices.Entry(device).State = EntityState.Detached;
                throw new ConflictException(
                    $"A device with identifier {identifier} already exists for this operator.");
            }
        }

        return new DeviceVm(
            device.DeviceId,
            device.AccountId,
            device.OperatorId,
            device.Serial,
            device.Name,
            device.Identifier,
            device.ProviderDisplayName,
            (DeviceType)device.DeviceTypeId,
            device.DeviceTypeId,
            device.Description,
            device.ProviderMetadataHash,
            device.ProviderStatus,
            (DetectedStatus)device.DetectedStatus,
            device.FirstSeenAt,
            device.LastSeenAt,
            device.LastSyncedAt,
            device.LastAssignedAt,
            device.IgnoredAt);
    }

    public async Task SetDetectedStatusAsync(Guid deviceId, DetectedStatus status, CancellationToken cancellationToken)
    {
        var device = await Context.Devices.FindAsync([deviceId], cancellationToken)
            ?? throw new NotFoundException(nameof(Entities.Device), deviceId.ToString());

        RequireAccountWriteAccess(device.AccountId);

        Context.Devices.Attach(device);
        device.DetectedStatus = (int)status;
        if (status == DetectedStatus.Ignored)
        {
            device.IgnoredAt = DateTimeOffset.UtcNow;
        }
        else if (device.IgnoredAt.HasValue && status != DetectedStatus.Ignored)
        {
            device.IgnoredAt = null;
        }
        AddAuditEvent(device.AccountId, "SynchronizedDevice.StatusChanged",
            "SynchronizedDevice", deviceId.ToString(), null, $"{{\"status\":\"{status}\"}}");
        await Context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteDeviceAsync(Guid deviceId, CancellationToken cancellationToken)
    {
        var device = await Context.Devices.FindAsync([deviceId], cancellationToken)
            ?? throw new NotFoundException(nameof(Entities.Device), deviceId.ToString());

        RequireAccountWriteAccess(device.AccountId);
        Context.Devices.Remove(device);
        AddAuditEvent(device.AccountId, "SynchronizedDevice.Deleted",
            "SynchronizedDevice", deviceId.ToString(), null, null);
        await Context.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> DeleteDevicesByOperatorAsync(Guid operatorId, CancellationToken cancellationToken)
    {
        var devices = await Context.Devices
            .Where(d => d.OperatorId == operatorId
                && (CanAccessAllAccounts || d.AccountId == Principal.AccountId))
            .ToListAsync(cancellationToken);

        if (devices.Count == 0) return 0;

        var deviceIds = devices.Select(d => d.DeviceId).ToHashSet();
        var transporterIdsWithWipedDevices = await Context.TransporterDeviceAssignments
            .Where(a => deviceIds.Contains(a.DeviceId))
            .Select(a => a.TransporterId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var transportersToDelete = await Context.Transporters
            .Where(t => transporterIdsWithWipedDevices.Contains(t.TransporterId)
                && !t.Assignments.Any(a => !deviceIds.Contains(a.DeviceId)))
            .ToListAsync(cancellationToken);
        var transporterIdsToDelete = transportersToDelete.Select(t => t.TransporterId).ToHashSet();

        if (transporterIdsToDelete.Count > 0)
        {
            var positions = await Context.TransporterPositions
                .AsTracking()
                .Where(p => transporterIdsToDelete.Contains(p.TransporterId))
                .ToListAsync(cancellationToken);
            Context.TransporterPositions.RemoveRange(positions);
        }

        foreach (var d in devices)
        {
            Context.Devices.Remove(d);
            AddAuditEvent(d.AccountId, "SynchronizedDevice.Wiped",
                "SynchronizedDevice", d.DeviceId.ToString(), null, null);
        }
        foreach (var t in transportersToDelete)
        {
            Context.Transporters.Remove(t);
            AddAuditEvent(t.AccountId, "Transporter.WipedWithSynchronizedDevices",
                "Transporter", t.TransporterId.ToString(), null, $"{{\"operatorId\":\"{operatorId}\"}}");
        }
        await Context.SaveChangesAsync(cancellationToken);
        return devices.Count;
    }
}
