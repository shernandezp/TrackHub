namespace TrackHub.Manager.Domain.Models;

public readonly record struct StoredObject(long SizeBytes, string Sha256Hash);
