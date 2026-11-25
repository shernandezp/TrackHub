namespace TrackHub.Manager.Domain.Interfaces;

/// <summary>
/// Transporter-owned documents follow group visibility, Staff-owned follow assignment visibility;
/// owner types without a registered resolver are denied.
/// </summary>
public interface IDocumentAccessPolicy
{
    Task<bool> CanAccessOwnerAsync(Guid accountId, string ownerEntityType, string ownerEntityId, bool forWrite, CancellationToken cancellationToken);

    /// <summary>Confidential/Legal require a privileged principal.</summary>
    bool IsClearedForClassification(string classification);

    Task<IReadOnlySet<Guid>> GetVisibleTransporterIdsAsync(Guid accountId, CancellationToken cancellationToken);

    /// <summary>Administrator/Manager/global service client: reads account-wide.</summary>
    bool IsPrivilegedPrincipal { get; }
}
