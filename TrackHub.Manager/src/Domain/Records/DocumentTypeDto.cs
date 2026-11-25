namespace TrackHub.Manager.Domain.Records;

public readonly record struct DocumentTypeDto(
    Guid AccountId,
    string Category,
    string? DisplayName,
    bool Required,
    bool Expiring,
    int? DefaultValidityDays = null);
