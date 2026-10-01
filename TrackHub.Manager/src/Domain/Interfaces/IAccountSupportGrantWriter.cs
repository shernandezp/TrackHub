namespace TrackHub.Manager.Domain.Interfaces;

public interface IAccountSupportGrantWriter
{
    Task<AccountSupportGrantVm> CreateAccountSupportGrantAsync(AccountSupportGrantDto accountSupportGrant, CancellationToken cancellationToken);
    Task ApproveAccountSupportGrantAsync(Guid accountSupportGrantId, CancellationToken cancellationToken);
    Task RevokeAccountSupportGrantAsync(Guid accountSupportGrantId, CancellationToken cancellationToken);
}
