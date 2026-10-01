namespace TrackHub.Manager.Infrastructure.ManagerDB.Storage;

// Server-generated storage key layout: {accountId}/{ownerType}/{documentId}/{version}.
// Never exposed in any read model.
public static class DocumentStorageKey
{
    // Unique per upload rather than per version: two uploads racing for the same next version must
    // never write to, or clean up, each other's bytes. Keys already stored keep their old shape.
    public static string For(Guid accountId, string ownerEntityType, Guid documentId, Guid uploadId)
        => $"{accountId:N}/{Sanitize(ownerEntityType)}/{documentId:N}/{uploadId:N}";

    private static string Sanitize(string ownerEntityType)
        => string.IsNullOrWhiteSpace(ownerEntityType)
            ? "unknown"
            : new string([.. ownerEntityType.Where(c => char.IsLetterOrDigit(c) || c is '-' or '_')]);
}
