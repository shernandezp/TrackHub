using Common.Application.Interfaces;

namespace TrackHub.Manager.Application.PublicLinks.Commands;

// MIXED SURFACE — read the handler before touching these attributes.
// [AllowCrossAccount] exists for TripManagement's trip_client hop, but it switches the guard off for
// EVERY caller; a grant for another tenant's document would be a permanent, anonymous data leak, so
// the handler re-binds user principals to their own account.
[Authorize(Resource = Resources.PublicLinks, Action = Actions.Write)]
[RequireFeature(FeatureKeys.PublicLinks)]
[AllowCrossAccount("TripManagement relays a user's trip-share action to Manager under the global trip_client identity (spec 11 §18.10 forbids a parallel link mechanism), and that token carries no account claim. User principals are NOT unguarded by this: the handler binds them to their own account below.")]
public readonly record struct CreatePublicLinkGrantCommand(PublicLinkGrantDto PublicLinkGrant) : IRequest<PublicLinkGrantVm>;
public class CreatePublicLinkGrantCommandHandler(IPublicLinkGrantWriter writer, ICurrentPrincipal principal) : IRequestHandler<CreatePublicLinkGrantCommand, PublicLinkGrantVm>
{
    public async Task<PublicLinkGrantVm> Handle(CreatePublicLinkGrantCommand request, CancellationToken cancellationToken)
    {
        // Restores, for user principals only, the tenant binding that [AllowCrossAccount] removes.
        if (principal.PrincipalType == PrincipalType.User
            && principal.AccountId != request.PublicLinkGrant.AccountId)
        {
            throw new ForbiddenAccessException(
                "Insufficient permissions. A public link may only be issued for the caller's own account.");
        }

        return await writer.CreatePublicLinkGrantAsync(request.PublicLinkGrant, cancellationToken);
    }
}

public sealed class CreatePublicLinkGrantCommandValidator : AbstractValidator<CreatePublicLinkGrantCommand>
{
    public CreatePublicLinkGrantCommandValidator()
    {
        RuleFor(v => v.PublicLinkGrant.ResourceType).NotEmpty().MaximumLength(ColumnMetadata.DefaultNameLength);
        RuleFor(v => v.PublicLinkGrant.ResourceId).NotEmpty().MaximumLength(ColumnMetadata.DefaultNameLength);
        RuleFor(v => v.PublicLinkGrant.Scopes).NotEmpty().MaximumLength(ColumnMetadata.DefaultDescriptionLength);
        RuleFor(v => v.PublicLinkGrant.Purpose).NotEmpty().MaximumLength(ColumnMetadata.DefaultDescriptionLength);
        RuleFor(v => v.PublicLinkGrant.CreatedByPrincipalId).MaximumLength(ColumnMetadata.DefaultNameLength);
        RuleFor(v => v.PublicLinkGrant.ExpiresAt).GreaterThan(_ => DateTimeOffset.UtcNow);
    }
}

[Authorize(Resource = Resources.PublicLinks, Action = Actions.Delete)]
[AllowCrossAccount("TripManagement relays a user's trip-share revocation here under the global trip_client identity with no account claim (same hop as CreatePublicLinkGrantCommand above). Tenant callers are NOT unguarded by this: PublicLinkGrantWriter.RevokePublicLinkGrantAsync loads the grant and RequireAccountWriteAccess checks its owning account.")]
public readonly record struct RevokePublicLinkGrantCommand(Guid PublicLinkGrantId, string? RevokedBy = null) : IRequest;
public class RevokePublicLinkGrantCommandHandler(IPublicLinkGrantWriter writer) : IRequestHandler<RevokePublicLinkGrantCommand>
{
    public async Task Handle(RevokePublicLinkGrantCommand request, CancellationToken cancellationToken) => await writer.RevokePublicLinkGrantAsync(request.PublicLinkGrantId, request.RevokedBy, cancellationToken);
}

// Access counting and the PublicLinkAccessed audit event live only in IPublicLinkGrantResolver: an
// access that was not a successful resolution is not an access, so no standalone "record access" surface.
