using Common.Application.Interfaces;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Readers;

// Platform reads for the system console, like the writer: support grants span customer accounts.
public sealed class AccountSupportGrantReader(IApplicationDbContext context, ICurrentPrincipal principal) : AccountScopedDataAccess(context, principal), IAccountSupportGrantReader
{
    private static int PageSize(int take) => Math.Clamp(take <= 0 ? 50 : take, 1, 500);
    private static int Offset(int skip) => Math.Max(0, skip);

    public async Task<AccountSupportGrantVm> GetSupportGrantStatusAsync(Guid accountSupportGrantId, CancellationToken cancellationToken)
    {
        var found = await Context.AccountSupportGrants
            .Where(x => x.AccountSupportGrantId == accountSupportGrantId)
            .Select(x => new AccountSupportGrantVm(x.AccountSupportGrantId, x.AccountId, x.SupportUserId, x.Reason, x.TicketReference, x.ApprovedBy, x.ApprovedAt, x.AccessLevel, x.StartsAt, x.EndsAt, x.RevokedAt, x.RevokedBy, x.LastModified))
            .FirstOrDefaultAsync(cancellationToken);
        ReaderResults.EnsureFound(found, nameof(Entities.AccountSupportGrant), accountSupportGrantId.ToString());
        return found;
    }

    public async Task<IReadOnlyCollection<AccountSupportGrantVm>> GetAccountSupportGrantsAsync(Guid? accountId, int skip, int take, CancellationToken cancellationToken)
    {
        return await Context.AccountSupportGrants
            .Where(x => !accountId.HasValue || x.AccountId == accountId.Value)
            .OrderByDescending(x => x.LastModified).ThenBy(x => x.AccountSupportGrantId)
            .Skip(Offset(skip)).Take(PageSize(take))
            .Select(x => new AccountSupportGrantVm(x.AccountSupportGrantId, x.AccountId, x.SupportUserId, x.Reason, x.TicketReference, x.ApprovedBy, x.ApprovedAt, x.AccessLevel, x.StartsAt, x.EndsAt, x.RevokedAt, x.RevokedBy, x.LastModified))
            .ToListAsync(cancellationToken);
    }
}
