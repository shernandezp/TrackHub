using Common.Application.Exceptions;
using Common.Application.Interfaces;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Writers;

public sealed class DriverWriter(IApplicationDbContext context, ICurrentPrincipal principal) : AccountScopedDataAccess(context, principal), IDriverWriter
{
    public async Task<DriverVm> CreateDriverAsync(DriverDto driver, CancellationToken cancellationToken)
    {
        var accountId = RequireAccountWriteAccess(driver.AccountId);
        await RequireTransporterInAccountAsync(driver.DefaultTransporterId, accountId, cancellationToken);

        // One person, one driver record: the same identity document is that driver, and a
        // deactivated one comes back instead of being cloned.
        var documentNumber = NormalizeDocumentNumber(driver.DocumentNumber);
        var twin = documentNumber is null
            ? null
            : await Context.Drivers.AsTracking().FirstOrDefaultAsync(x => x.AccountId == accountId && x.DocumentNumber == documentNumber, cancellationToken);
        if (twin is { Active: true })
        {
            throw new ConflictException("A driver with the same document number already exists.");
        }

        if (twin is not null)
        {
            var oldValues = AuditValues(twin);
            Apply(twin, driver with { DocumentNumber = documentNumber, Active = true });
            AddAuditEvent(twin.AccountId, "ReactivateDriver", "Driver", twin.DriverId.ToString(), oldValues, AuditValues(twin));
            await Context.SaveChangesAsync(cancellationToken);
            return ToVm(twin);
        }

        var entity = new Driver(accountId, driver.Name, driver.Phone, driver.DocumentType, documentNumber, driver.Active, driver.EmployeeCode, driver.LicenseNumber, driver.LicenseExpiresAt, driver.DefaultTransporterId);
        await Context.Drivers.AddAsync(entity, cancellationToken);
        AddAuditEvent(entity.AccountId, "CreateDriver", "Driver", entity.DriverId.ToString(), null, AuditValues(entity));
        await Context.SaveChangesAsync(cancellationToken);
        return ToVm(entity);
    }


    public async Task UpdateDriverAsync(Guid driverId, DriverDto driver, CancellationToken cancellationToken)
    {
        var entity = await GetDriverForWriteAsync(driverId, cancellationToken);
        if (driver.AccountId != entity.AccountId)
        {
            throw new ForbiddenAccessException();
        }

        await RequireTransporterInAccountAsync(driver.DefaultTransporterId, entity.AccountId, cancellationToken);

        var documentNumber = NormalizeDocumentNumber(driver.DocumentNumber);
        if (documentNumber is not null && await Context.Drivers.AnyAsync(
            x => x.AccountId == entity.AccountId && x.DocumentNumber == documentNumber && x.DriverId != driverId, cancellationToken))
        {
            throw new ConflictException("A driver with the same document number already exists.");
        }

        RowVersion.Expect(Context.Drivers, entity, driver.ExpectedVersion);
        var oldValues = AuditValues(entity);
        Apply(entity, driver with { DocumentNumber = documentNumber });
        AddAuditEvent(entity.AccountId, "UpdateDriver", "Driver", entity.DriverId.ToString(), oldValues, AuditValues(entity));
        await Context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeactivateDriverAsync(Guid driverId, CancellationToken cancellationToken)
    {
        var entity = await GetDriverForWriteAsync(driverId, cancellationToken);
        var oldValues = AuditValues(entity);
        entity.Active = false;
        AddAuditEvent(entity.AccountId, "DeactivateDriver", "Driver", entity.DriverId.ToString(), oldValues, AuditValues(entity));
        await Context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Spec 09 §5: cross-account transporter references must fail. Without this, a driver in account A
    /// could be pointed at a transporter in account B, and because <c>ValidateDriverAssignment</c>
    /// accepts the default-transporter match, <c>DocumentAccessPolicy</c> would then grant that driver
    /// access to account B's documents. The assignment path always checked this; the default-transporter
    /// scalar did not.
    /// </summary>
    private async Task RequireTransporterInAccountAsync(Guid? transporterId, Guid accountId, CancellationToken cancellationToken)
    {
        if (!transporterId.HasValue)
        {
            return;
        }

        var exists = await Context.Transporters.AnyAsync(x => x.TransporterId == transporterId.Value && x.AccountId == accountId && x.RetiredAt == null, cancellationToken);
        if (!exists)
        {
            throw new NotFoundException(nameof(Transporter), transporterId.Value.ToString());
        }
    }

    private async Task<Driver> GetDriverForWriteAsync(Guid driverId, CancellationToken cancellationToken)
    {
        var entity = await RequireScopedAsync(Context.Drivers.AsTracking(), x => x.DriverId == driverId, x => x.AccountId, driverId, forWrite: true, cancellationToken);
        return entity;
    }

    private static string? NormalizeDocumentNumber(string? value)
        => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static void Apply(Driver entity, DriverDto driver)
    {
        entity.Name = driver.Name;
        entity.Phone = driver.Phone;
        entity.DocumentType = driver.DocumentType;
        entity.DocumentNumber = driver.DocumentNumber;
        entity.Active = driver.Active;
        entity.EmployeeCode = driver.EmployeeCode;
        entity.LicenseNumber = driver.LicenseNumber;
        entity.LicenseExpiresAt = driver.LicenseExpiresAt;
        entity.DefaultTransporterId = driver.DefaultTransporterId;
    }

    private static DriverVm ToVm(Driver x) => new(x.DriverId, x.AccountId, x.Name, x.Phone, x.DocumentType, x.DocumentNumber, x.Active, x.EmployeeCode, x.LicenseNumber, x.LicenseExpiresAt, x.DefaultTransporterId, x.LastModified, x.Version);

    private static string AuditValues(Driver driver)
        => $$"""{"name":{{Quote(driver.Name)}},"phone":{{Quote(driver.Phone)}},"documentType":{{Quote(driver.DocumentType)}},"documentNumber":{{Quote(driver.DocumentNumber)}},"active":{{(driver.Active ? "true" : "false")}},"employeeCode":{{Quote(driver.EmployeeCode)}},"licenseNumber":{{Quote(driver.LicenseNumber)}},"licenseExpiresAt":{{Quote(driver.LicenseExpiresAt?.ToString("O"))}},"defaultTransporterId":{{Quote(driver.DefaultTransporterId?.ToString())}}}""";
}
