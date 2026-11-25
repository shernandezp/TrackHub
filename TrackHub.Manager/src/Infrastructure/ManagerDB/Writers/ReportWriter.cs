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

using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;
using Common.Application.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Writers;

public sealed class ReportWriter(IApplicationDbContext context, ICurrentPrincipal principal) : IReportWriter
{
    public async Task UpdateReportAsync(UpdateReportDto reportDto, CancellationToken cancellationToken)
    {
        var report = await context.Reports.FindAsync(reportDto.ReportId, cancellationToken)
            ?? throw new NotFoundException(nameof(Report), $"{reportDto.ReportId}");

        context.Reports.Attach(report);

        var previous = Describe(report);
        report.Description = reportDto.Description;
        report.Type = reportDto.TypeId;
        report.Active = reportDto.Active;
        report.Category = reportDto.Category;
        report.RequiredFeatureKey = reportDto.RequiredFeatureKey;
        report.ManagerOnly = reportDto.ManagerOnly;
        report.SupportsPdf = reportDto.SupportsPdf;
        report.SortOrder = reportDto.SortOrder;

        // The report catalog is platform-wide, so the audit row carries the platform account.
        context.AuditEvents.Add(AuditTrail.Create(principal, Guid.Empty, "UpdateReport", "Report", $"{report.ReportId}", previous, Describe(report)));
        await context.SaveChangesAsync(cancellationToken);
    }

    private static string Describe(Report report)
        => $$"""{"description":{{AuditJson.Quote(report.Description)}},"type":{{report.Type}},"active":{{report.Active.ToString().ToLowerInvariant()}},"category":{{AuditJson.Quote(report.Category)}},"requiredFeatureKey":{{AuditJson.Quote(report.RequiredFeatureKey)}},"managerOnly":{{report.ManagerOnly.ToString().ToLowerInvariant()}},"supportsPdf":{{report.SupportsPdf.ToString().ToLowerInvariant()}},"sortOrder":{{report.SortOrder}}}""";
}
