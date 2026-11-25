namespace TrackHub.Reporting.Domain.Options;

// Configurable export limits. Bound from the Reporting service
// configuration section `AppSettings:Reporting` and registered as a singleton so Domain helpers can take
// it by constructor.
public sealed class ReportingLimitsOptions
{
    // Maximum rows in a single (unpaginated) Excel export.
    // Exceeded → ReportLimitExceededException → 400.
    public int MaxExportRows { get; set; } = 100_000;

    // PDF is for short reports; a dataset above this returns 400 advising Excel (never a truncated PDF).
    public int MaxPdfRows { get; set; } = 500;

    // Preview returns the first N rows plus totalRows/truncated metadata.
    public int PreviewRows { get; set; } = 100;
}
