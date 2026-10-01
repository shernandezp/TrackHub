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

namespace TrackHub.Reporting.Application.Report.Factory.Workforce;

// Shared projection helpers for the workforce reports.
internal static class WorkforceReportSupport
{
    // Whole days between the account's today and the expiry date; negative once expired.
    public static int? DaysUntil(this DateOnly? date, DateOnly today)
        => date is { } value ? value.DayNumber - today.DayNumber : null;

    public static string OrEmpty(this string? value) => value ?? string.Empty;
}
