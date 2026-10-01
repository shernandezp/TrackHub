namespace TrackHub.Reporting.Domain.Exceptions;

// The requested report code is unknown or inactive in the governed catalog.
public sealed class ReportNotFoundException(string reportCode)
    : Exception($"Report '{reportCode}' was not found.")
{
    public string Code => ReportErrorCodes.NotFound;
    public string ReportCode { get; } = reportCode;
}
