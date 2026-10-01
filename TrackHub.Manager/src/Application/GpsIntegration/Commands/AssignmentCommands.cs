namespace TrackHub.Manager.Application.GpsIntegration.Commands;

[Authorize(Resource = Resources.SynchronizedDevices, Action = Actions.Edit)]

// Enforcement: the writer or reader checks every referenced id against the request's account.
[AccountScopeEnforcedInHandler]
public readonly record struct AssignDeviceToTransporterCommand(TransporterDeviceAssignmentDto Assignment) : IRequest<TransporterDeviceAssignmentVm>;
public class AssignDeviceToTransporterCommandHandler(ITransporterDeviceAssignmentWriter writer)
    : IRequestHandler<AssignDeviceToTransporterCommand, TransporterDeviceAssignmentVm>
{
    public Task<TransporterDeviceAssignmentVm> Handle(AssignDeviceToTransporterCommand request, CancellationToken cancellationToken)
        => writer.AssignAsync(request.Assignment, cancellationToken);
}
