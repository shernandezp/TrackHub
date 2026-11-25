namespace TrackHub.Manager.Domain.Interfaces;

/// <summary>Uploaded files stay Quarantined until a scan returns Clean.</summary>
public interface IDocumentScanner
{
    string Provider { get; }

    /// <summary>Returns a <see cref="Constants.DocumentScanStatuses"/> value (Clean/Infected/Failed).</summary>
    Task<string> ScanAsync(string storageKey, CancellationToken cancellationToken);
}
