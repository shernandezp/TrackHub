namespace TrackHub.Manager.Domain.Interfaces;

public interface IPublicLinkGrantReader
{
    Task<PublicLinkGrantVm> GetPublicLinkGrantAsync(Guid publicLinkGrantId, CancellationToken cancellationToken);
    Task<PublicLinkGrantsPageVm> GetPublicLinkGrantsByAccountAsync(Guid accountId, int skip, int take, CancellationToken cancellationToken);
}
