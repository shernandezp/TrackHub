using TrackHub.Manager.Application.PublicLinks.Commands;

namespace TrackHub.Manager.Web.GraphQL.Mutation;

public partial class Mutation
{
    public async Task<PublicLinkGrantVm> CreatePublicLinkGrant([Service] ISender sender, CreatePublicLinkGrantCommand command, CancellationToken cancellationToken) => await sender.Send(command, cancellationToken);
    public async Task<bool> RevokePublicLinkGrant([Service] ISender sender, RevokePublicLinkGrantCommand command, CancellationToken cancellationToken) { await sender.Send(command, cancellationToken); return true; }
    // ServiceClient-only. Shares one implementation with the anonymous REST endpoint, so access
    // counting and the `PublicLinkAccessed` audit event happen exactly once per successful resolution.
    public async Task<PublicLinkResolutionVm> ResolvePublicLinkGrant([Service] ISender sender, ResolvePublicLinkGrantCommand command, CancellationToken cancellationToken) => await sender.Send(command, cancellationToken);
}
