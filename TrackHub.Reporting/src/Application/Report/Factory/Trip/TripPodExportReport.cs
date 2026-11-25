// Copyright (c) 2026 Sergio Hernandez. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License").
//  You may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

using TrackHub.Reporting.Domain.Interfaces.Factory;
using TrackHub.Reporting.Domain.Interfaces.Trip;
using TrackHub.Reporting.Domain.Models;
using TrackHub.Reporting.Domain.Records;

namespace TrackHub.Reporting.Application.Report.Factory.Trip;

// Proof-of-delivery register. Filters: from/to = window, transporterId =
// optional unit. Most recent capture first. Excel only.
//
// SENSITIVE EXPORT: it carries receiver names, receiver identity documents and the coordinates where
// the signature was captured. It audits like every other export because the export audit has no
// severity dimension; give the audit one rather than adding a local flag to this report.
public sealed class TripPodExportReport(ITripReportReader reader) : IReport
{
    public string ReportCode => TripReportCodes.PodExport;

    public async Task<ReportDataset> GetDatasetAsync(FilterDto filters, CancellationToken cancellationToken)
    {
        await reader.EnsureTripManagementFeatureAsync(cancellationToken);

        var transporterId = filters.GetGuid(FilterNames.Transporter);
        var window = ReportCalendar.Window(filters);

        var pods = await reader.GetTripProofsOfDeliveryAsync(
            window.From, window.To, transporterId, staffId: null, cancellationToken);

        var rows = pods
            .OrderByDescending(p => p.CapturedAt)
            .ThenBy(p => p.TripCode, StringComparer.OrdinalIgnoreCase)
            .ThenBy(p => p.StopSequence)
            .Select(p => new TripPodExportRowVm(
                p.TripCode,
                p.StopSequence,
                p.StopName,
                p.ReceiverName,
                p.ReceiverDocument.OrEmpty(),
                p.CapturedAt,
                p.Latitude,
                p.Longitude,
                p.DocumentCount))
            .ToList();

        return ReportDataset.Create(filters, rows);
    }
}
