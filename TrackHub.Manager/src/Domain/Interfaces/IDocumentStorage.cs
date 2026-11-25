namespace TrackHub.Manager.Domain.Interfaces;

/// <summary>The only path to document bytes; the database stores metadata only.</summary>
public interface IDocumentStorage
{
    /// <summary>Persisted on the document.</summary>
    string Provider { get; }

    /// <summary>Computes the SHA-256 and length server-side; overwrites any existing object at the key.</summary>
    Task<StoredObject> SaveAsync(string storageKey, Stream content, string contentType, CancellationToken cancellationToken);

    Task<Stream> OpenReadAsync(string storageKey, CancellationToken cancellationToken);

    /// <summary>Null for providers that must stream (local FS), signalling the caller to stream instead.</summary>
    Task<Uri?> TryCreatePresignedDownloadUrlAsync(string storageKey, string fileName, TimeSpan ttl, CancellationToken cancellationToken);

    /// <summary>No-op if already absent.</summary>
    Task DeleteAsync(string storageKey, CancellationToken cancellationToken);

    Task<bool> ExistsAsync(string storageKey, CancellationToken cancellationToken);
}
