namespace TrackHub.Manager.Application.AccountFeatures.Commands;

[Authorize(Resource = Resources.AccountFeaturesMaster, Action = Actions.Write)]
[AllowCrossAccount("Master/platform administration surface (portal systemadmin console): an operator holding AccountFeaturesMaster/Write provisions the feature matrix OF another account, so the target account is necessarily not their own.")]
public readonly record struct SetAccountFeatureMasterCommand(AccountFeatureDto Feature) : IRequest<AccountFeatureVm>;
public class SetAccountFeatureMasterCommandHandler(IAccountFeatureMasterWriter writer) : IRequestHandler<SetAccountFeatureMasterCommand, AccountFeatureVm>
{
    public async Task<AccountFeatureVm> Handle(SetAccountFeatureMasterCommand request, CancellationToken cancellationToken) => await writer.SetAccountFeatureAsync(request.Feature, cancellationToken);
}
