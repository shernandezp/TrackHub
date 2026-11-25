namespace TrackHub.Manager.Domain.Interfaces;

/// <summary>
/// Not scoped to the caller's own account; authorization is enforced by the AccountFeaturesMaster resource.
/// </summary>
public interface IAccountFeatureMasterReader
{
    Task<IReadOnlyCollection<AccountFeatureVm>> GetAccountFeaturesAsync(Guid accountId, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<AccountFeatureVm>> GetAllAccountFeaturesAsync(int skip, int take, CancellationToken cancellationToken);
}
