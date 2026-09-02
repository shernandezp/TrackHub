/**
 * Copyright (c) 2025 Sergio Hernandez. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

using TrackHub.Reporting.Domain.Records;
using Common.Application.Interfaces;
using Common.Domain.Time;

namespace TrackHub.Reporting.Application.Report.Factory;

/// <summary>
/// The calendar a report is read in: the caller's account zone. Report filters arrive as instants
/// and the module producers store DATES, so the window is converted in the customer's calendar,
/// not the server's.
/// </summary>
public static class ReportCalendar
{
    public static Task<AccountTimeZone> ForCallerAsync(IUser user, IAccountTimeZoneResolver zones, CancellationToken cancellationToken)
        => zones.ResolveAsync(user.AccountId ?? throw new UnauthorizedAccessException(), cancellationToken);

    /// <summary>
    /// A report period from the From/To filters: the calendar days of the instants in the account
    /// zone, defaulting to the last month up to today.
    /// </summary>
    public static (DateOnly From, DateOnly To) Period(FilterDto filters, AccountTimeZone? calendar)
    {
        calendar ??= AccountTimeZone.Utc;
        var to = filters.GetDate(FilterNames.To) is { } t ? calendar.DateOf(t) : calendar.Today();
        var from = filters.GetDate(FilterNames.From) is { } f ? calendar.DateOf(f) : to.AddMonths(-1);
        return (from, to);
    }
}
