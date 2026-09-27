using Common.Application.Interfaces;

namespace TrackHub.Manager.Application.Drivers.Queries;

[Authorize(Resource = Resources.Drivers, Action = Actions.Read)]
// Enforcement: the reader/writer this handler delegates to extends AccountScopedDataAccess and
// checks the loaded row's owning account (RequireAccountAccess) or filters on the caller's scope.
[AccountScopeEnforcedInHandler]
public readonly record struct GetDriverQuery(Guid DriverId) : IRequest<DriverVm>;
public class GetDriverQueryHandler(IDriverReader reader) : IRequestHandler<GetDriverQuery, DriverVm>
{
    public async Task<DriverVm> Handle(GetDriverQuery request, CancellationToken cancellationToken) => await reader.GetDriverAsync(request.DriverId, cancellationToken);
}

[Authorize(Resource = Resources.Drivers, Action = Actions.Read)]
public readonly record struct GetDriversByAccountQuery(Guid AccountId, int Skip = 0, int Take = 50) : IRequest<IReadOnlyCollection<DriverVm>>;
public class GetDriversByAccountQueryHandler(IDriverReader reader) : IRequestHandler<GetDriversByAccountQuery, IReadOnlyCollection<DriverVm>>
{
    public async Task<IReadOnlyCollection<DriverVm>> Handle(GetDriversByAccountQuery request, CancellationToken cancellationToken) => await reader.GetDriversByAccountAsync(request.AccountId, request.Skip, request.Take, cancellationToken);
}

[Authorize(Resource = Resources.Drivers, Action = Actions.Read)]
// Enforcement: the reader/writer this handler delegates to extends AccountScopedDataAccess and
// checks the loaded row's owning account (RequireAccountAccess) or filters on the caller's scope.
[AccountScopeEnforcedInHandler]
public readonly record struct GetDriverAssignmentsQuery(Guid DriverId) : IRequest<IReadOnlyCollection<DriverAssignmentVm>>;
public class GetDriverAssignmentsQueryHandler(IDriverReader reader) : IRequestHandler<GetDriverAssignmentsQuery, IReadOnlyCollection<DriverAssignmentVm>>
{
    public async Task<IReadOnlyCollection<DriverAssignmentVm>> Handle(GetDriverAssignmentsQuery request, CancellationToken cancellationToken) => await reader.GetDriverAssignmentsAsync(request.DriverId, cancellationToken);
}

[Authorize(Resource = Resources.Drivers, Action = Actions.Read)]
[AllowCrossAccount("Assignment probe issued by TripManagement's global trip_client service identity (no account claim) when validating a trip's driver, mirroring the validateGroupVisibility/validateFeatureEnabled probes. Returns a bare boolean.")]
public readonly record struct ValidateDriverAssignmentQuery(Guid DriverId, string ResourceType, string ResourceId) : IRequest<bool>;
public class ValidateDriverAssignmentQueryHandler(IDriverReader reader) : IRequestHandler<ValidateDriverAssignmentQuery, bool>
{
    public async Task<bool> Handle(ValidateDriverAssignmentQuery request, CancellationToken cancellationToken) => await reader.ValidateDriverAssignmentAsync(request.DriverId, request.ResourceType, request.ResourceId, cancellationToken);
}

// The trip board's driver picker: a dispatcher holds Trips/Read, not Drivers/Read, and needs names
// and ids, never the phone, document or licence the full driver read carries.
[Authorize(Resource = Resources.Trips, Action = Actions.Read)]
[AccountScopeEnforcedInHandler]
public readonly record struct GetDriverLookupQuery(string? Search = null, IReadOnlyCollection<Guid>? DriverIds = null) : IRequest<IReadOnlyCollection<DriverLookupVm>>;
public class GetDriverLookupQueryHandler(IDriverReader reader, IUserReader userReader, IUser user) : IRequestHandler<GetDriverLookupQuery, IReadOnlyCollection<DriverLookupVm>>
{
    private Guid UserId { get; } = Guid.TryParse(user.Id, out var userId) ? userId : throw new UnauthorizedAccessException();

    public async Task<IReadOnlyCollection<DriverLookupVm>> Handle(GetDriverLookupQuery request, CancellationToken cancellationToken)
    {
        var caller = await userReader.GetUserAsync(UserId, cancellationToken);
        var rows = await reader.GetDriverLookupAsync(caller.AccountId, request.Search, request.DriverIds, Lookups.LookupLimits.FetchSize, cancellationToken);
        return Lookups.LookupLimits.EnsureWithinCeiling(rows, "driverLookup");
    }
}
