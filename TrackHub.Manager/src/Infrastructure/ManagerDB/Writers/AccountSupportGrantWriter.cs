using Common.Application.Exceptions;
using Common.Application.Interfaces;
using Common.Domain.Constants;
using FluentValidation.Results;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Writers;

// Support grants are a platform process run from the system console: an administrator requests
// entry into a customer account for a platform administrator, a second administrator approves it,
// and any administrator may revoke it. None of them belongs to the customer account, so the
// account is checked for existence, never for membership.
public sealed class AccountSupportGrantWriter(IApplicationDbContext context, ICurrentPrincipal principal) : AccountScopedDataAccess(context, principal), IAccountSupportGrantWriter
{
    public async Task<AccountSupportGrantVm> CreateAccountSupportGrantAsync(AccountSupportGrantDto accountSupportGrant, CancellationToken cancellationToken)
    {
        if (!await Context.Accounts.AnyAsync(x => x.AccountId == accountSupportGrant.AccountId, cancellationToken))
        {
            throw new NotFoundException("Account", accountSupportGrant.AccountId.ToString());
        }

        if (!await Context.Users.AnyAsync(x => x.UserId == accountSupportGrant.SupportUserId && x.Role == Roles.Administrator, cancellationToken))
        {
            throw new ValidationException([new ValidationFailure(nameof(accountSupportGrant.SupportUserId), "The support user must be a platform administrator.")]);
        }

        var entity = new AccountSupportGrant(accountSupportGrant.AccountId, accountSupportGrant.SupportUserId, accountSupportGrant.Reason, accountSupportGrant.TicketReference, accountSupportGrant.AccessLevel, accountSupportGrant.StartsAt, accountSupportGrant.EndsAt);
        await Context.AccountSupportGrants.AddAsync(entity, cancellationToken);
        AddAuditEvent(entity.AccountId, "CreateAccountSupportGrant", "AccountSupportGrant", entity.AccountSupportGrantId.ToString(), null, AuditValues(entity));
        await Context.SaveChangesAsync(cancellationToken);
        return ToVm(entity);
    }

    public async Task ApproveAccountSupportGrantAsync(Guid accountSupportGrantId, CancellationToken cancellationToken)
    {
        var entity = await LoadAsync(accountSupportGrantId, cancellationToken);
        var approver = ActorOf(null);

        if (string.Equals(entity.CreatedBy, approver, StringComparison.OrdinalIgnoreCase)
            || string.Equals(entity.SupportUserId.ToString(), approver, StringComparison.OrdinalIgnoreCase))
        {
            throw new ForbiddenAccessException("A support grant must be approved by an administrator other than its requester and its support user.");
        }

        if (entity.RevokedAt.HasValue)
        {
            throw new ConflictException("The support grant is revoked.");
        }

        if (entity.ApprovedAt.HasValue)
        {
            throw new ConflictException("The support grant is already approved.");
        }

        var oldValues = AuditValues(entity);
        entity.ApprovedBy = approver;
        entity.ApprovedAt = DateTimeOffset.UtcNow;
        AddAuditEvent(entity.AccountId, "ApproveAccountSupportGrant", "AccountSupportGrant", entity.AccountSupportGrantId.ToString(), oldValues, AuditValues(entity));
        await Context.SaveChangesAsync(cancellationToken);
    }

    public async Task RevokeAccountSupportGrantAsync(Guid accountSupportGrantId, CancellationToken cancellationToken)
    {
        var entity = await LoadAsync(accountSupportGrantId, cancellationToken);
        if (entity.RevokedAt.HasValue)
        {
            return;
        }

        var oldValues = AuditValues(entity);
        entity.RevokedBy = ActorOf(null);
        entity.RevokedAt = DateTimeOffset.UtcNow;
        AddAuditEvent(entity.AccountId, "RevokeAccountSupportGrant", "AccountSupportGrant", entity.AccountSupportGrantId.ToString(), oldValues, AuditValues(entity));
        await Context.SaveChangesAsync(cancellationToken);
    }

    private async Task<AccountSupportGrant> LoadAsync(Guid accountSupportGrantId, CancellationToken cancellationToken)
        => await Context.AccountSupportGrants.AsTracking().FirstOrDefaultAsync(x => x.AccountSupportGrantId == accountSupportGrantId, cancellationToken)
            ?? throw new NotFoundException(nameof(AccountSupportGrant), accountSupportGrantId.ToString());

    private static AccountSupportGrantVm ToVm(AccountSupportGrant x)
        => new(x.AccountSupportGrantId, x.AccountId, x.SupportUserId, x.Reason, x.TicketReference, x.ApprovedBy, x.ApprovedAt, x.AccessLevel, x.StartsAt, x.EndsAt, x.RevokedAt, x.RevokedBy, x.LastModified);

    private static string AuditValues(AccountSupportGrant grant)
        => AuditJson.Of(new { grant.SupportUserId, grant.Reason, grant.TicketReference, grant.ApprovedBy, grant.ApprovedAt, grant.AccessLevel, grant.StartsAt, grant.EndsAt, grant.RevokedAt, grant.RevokedBy });
}
