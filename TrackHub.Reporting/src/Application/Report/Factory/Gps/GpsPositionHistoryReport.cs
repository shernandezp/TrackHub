using Common.Application.Interfaces;
using Common.Domain.Constants;
using TrackHub.Reporting.Domain.Interfaces;
using TrackHub.Reporting.Domain.Interfaces.Factory;
using TrackHub.Reporting.Domain.Interfaces.Telemetry;
using TrackHub.Reporting.Domain.Models;
using TrackHub.Reporting.Domain.Options;
using TrackHub.Reporting.Domain.Records;

namespace TrackHub.Reporting.Application.Report.Factory.Gps;

public sealed class GpsPositionHistoryReport(
    IUser user,
    IAccountFeatureReader features,
    IGpsTelemetryReader telemetry,
    ReportingLimitsOptions limits) : IReport
{
    public string ReportCode => Reports.GpsPositionHistory;

    public async Task<ReportDataset> GetDatasetAsync(FilterDto filters, CancellationToken cancellationToken)
    {
        var accountId = await GpsReportSupport.RequireAccountAsync(user, features, FeatureKeys.GpsPositionHistory, cancellationToken);
        Guid? transporterId = filters.GetGuid(FilterNames.Transporter);
        Guid? deviceId = filters.GetGuid(FilterNames.Device);
        var take = GpsReportSupport.ResolveTake(filters, limits);
        // The window goes to the SOURCE: filtering here intersected the caller's range with the
        // newest N rows the reader had already truncated to, so an older period exported almost
        // nothing on an active fleet.
        var from = filters.GetDate(FilterNames.From);
        var to = filters.GetDate(FilterNames.To);
        var history = await telemetry.GetPositionHistoryAsync(accountId, transporterId, deviceId, take, from, to, cancellationToken);

        var rows = history
            .OrderByDescending(p => p.SourceTimestamp)
            .Select(p => new GpsPositionHistoryRowVm(
                p.TransporterId,
                p.SourceTimestamp,
                p.Latitude,
                p.Longitude,
                p.DeviceId,
                p.AccountId))
            .ToList();
        return ReportDataset.Create(filters, rows);
    }
}
