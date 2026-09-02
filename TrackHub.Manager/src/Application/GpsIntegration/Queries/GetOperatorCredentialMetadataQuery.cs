using Ardalis.GuardClauses;
using Microsoft.Extensions.Configuration;

namespace TrackHub.Manager.Application.GpsIntegration.Queries;

[Authorize(Resource = Resources.Credentials, Action = Actions.Read)]

// Enforcement: the reader/writer this handler delegates to extends AccountScopedDataAccess and
// checks the loaded row's owning account (RequireAccountAccess) or filters on the caller's scope.
[AccountScopeEnforcedInHandler]
public readonly record struct GetOperatorCredentialMetadataQuery(Guid OperatorId) : IRequest<CredentialMetadataVm?>;

public class GetOperatorCredentialMetadataQueryHandler(ICredentialReader reader, IConfiguration configuration)
    : IRequestHandler<GetOperatorCredentialMetadataQuery, CredentialMetadataVm?>
{
    public Task<CredentialMetadataVm?> Handle(GetOperatorCredentialMetadataQuery request, CancellationToken cancellationToken)
    {
        // The username hint is derived from the decrypted value, so the reader needs the key.
        var key = configuration["AppSettings:EncryptionKey"];
        Guard.Against.Null(key, message: "Credential key not found.");
        return reader.GetMetadataByOperatorAsync(request.OperatorId, key, cancellationToken);
    }
}
