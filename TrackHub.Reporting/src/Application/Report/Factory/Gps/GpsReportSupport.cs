// Copyright (c) 2026 Sergio Hernandez. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License").
//  You may not use this file except in compliance with the License.
//

using TrackHub.Reporting.Domain.Paging;
using Common.Application.Interfaces;
using TrackHub.Reporting.Domain.Interfaces;
using TrackHub.Reporting.Domain.Interfaces.Telemetry;
using TrackHub.Reporting.Domain.Options;
using TrackHub.Reporting.Domain.Records;

namespace TrackHub.Reporting.Application.Report.Factory.Gps;

internal static class GpsReportSupport
{
    public const int DefaultPageSize = 5000;

    public static async Task<Guid> RequireAccountAsync(IUser user, IAccountFeatureReader features, string featureKey, CancellationToken ct)
    {
        var accountId = user.AccountId ?? throw new UnauthorizedAccessException();
        await features.EnsureFeatureEnabledAsync(accountId, featureKey, ct);
        return accountId;
    }

    // Clamp ceiling comes from configuration — the caller passes the resolved limits.
    public static int ResolveTake(FilterDto filters, ReportingLimitsOptions limits, int defaultTake = DefaultPageSize)
    {
        var maxRows = filters.GetNumber(FilterNames.MaxRows);
        if (maxRows is not > 0)
        {
            return defaultTake;
        }

        return (int)Math.Min(maxRows.Value, limits.MaxExportRows);
    }

    // The window goes to the source and the feed is followed to its end; a capped newest-first
    // page filtered in memory made a monthly statistic cover the last day or two.
    public static async Task<IReadOnlyCollection<Domain.Models.Manager.ManagerOperatorSyncRunVm>> DrainSyncRunsAsync(
        IGpsTelemetryReader telemetry, Guid accountId, Guid? operatorId, FilterDto filters, int take, CancellationToken cancellationToken)
    {
        var from = filters.GetDate(FilterNames.From);
        var to = filters.GetDate(FilterNames.To);
        return await FeedDrain.DrainByCursorAsync<Domain.Models.Manager.ManagerOperatorSyncRunVm>(async cursor =>
        {
            var page = await telemetry.GetOperatorSyncRunFeedAsync(accountId, operatorId, from, to, take, cursor, cancellationToken);
            return (page.Items, page.HasMore, page.NextCursor);
        });
    }
}
