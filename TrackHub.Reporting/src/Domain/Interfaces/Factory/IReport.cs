using TrackHub.Reporting.Domain.Records;
using TrackHub.Reporting.Domain.Models;

namespace TrackHub.Reporting.Domain.Interfaces.Factory;

public interface IReport
{
    string ReportCode { get; }

    // Fetches the report's data and projects it into a format-agnostic dataset. The execution pipeline
    // then renders it (Excel/PDF) or serializes it (preview).
    Task<ReportDataset> GetDatasetAsync(FilterDto filters, CancellationToken cancellationToken);

    // True when the rows are its primary feed's rows, one for one and in the producer's order, read
    // through a previewable drain: the preview then reads one page instead of the whole feed.
    bool StreamsInProducerOrder => false;
}
