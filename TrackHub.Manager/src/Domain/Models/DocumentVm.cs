namespace TrackHub.Manager.Domain.Models;

// StorageProvider and StorageKey are never exposed. DownloadUrl is populated only after
// authorization + ScanStatus == Clean, else null.
public readonly record struct DocumentVm(
    Guid DocumentId,
    Guid AccountId,
    string OwnerEntityType,
    string OwnerEntityId,
    string UploadedByPrincipalType,
    string UploadedByPrincipalId,
    string FileName,
    string Category,
    string? Title,
    string? Description,
    string ContentType,
    long SizeBytes,
    string Sha256Hash,
    string Classification,
    string Status,
    DateTimeOffset? ExpiresAt,
    string VisibilityScope,
    string ScanStatus,
    int CurrentVersion,
    string? DownloadUrl,
    DateTimeOffset LastModified);
