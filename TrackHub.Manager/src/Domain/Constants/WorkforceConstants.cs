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

namespace TrackHub.Manager.Domain.Constants;

public static class StaffQualificationTypes
{
    public const string License = nameof(License);
    public const string MedicalExam = nameof(MedicalExam);
    public const string Training = nameof(Training);
    public const string BackgroundCheck = nameof(BackgroundCheck);
    public const string HazmatPermit = nameof(HazmatPermit);
    public const string Other = nameof(Other);

    public static readonly IReadOnlyCollection<string> All =
        [License, MedicalExam, Training, BackgroundCheck, HazmatPermit, Other];

    public static bool IsValid(string? value) => value != null && All.Contains(value);
}

/// <summary>
/// Qualification lifecycle status. Expiry is DERIVED from <c>ExpiresAt</c> at read time; this column
/// only records the states a date cannot express (explicit revocation).
/// </summary>
public static class StaffQualificationStatuses
{
    public const string Valid = nameof(Valid);
    public const string Expired = nameof(Expired);
    public const string Revoked = nameof(Revoked);

    public static readonly IReadOnlyCollection<string> All = [Valid, Expired, Revoked];

    public static bool IsValid(string? value) => value != null && All.Contains(value);
}

public static class StaffAssignmentTypes
{
    public const string Regular = nameof(Regular);
    public const string Temporary = nameof(Temporary);

    public static readonly IReadOnlyCollection<string> All = [Regular, Temporary];

    public static bool IsValid(string? value) => value != null && All.Contains(value);
}

public static class StaffAssignmentStatuses
{
    public const string Active = nameof(Active);
    public const string Ended = nameof(Ended);
    public const string Cancelled = nameof(Cancelled);

    public static readonly IReadOnlyCollection<string> All = [Active, Ended, Cancelled];

    public static bool IsValid(string? value) => value != null && All.Contains(value);
}

public static class WorkforceLimits
{
    /// <summary>
    /// Qualification-expiration alert thresholds in days. <c>0</c> is the "expired today or past due"
    /// band; the scan raises at most one alert per (qualification, threshold) forever.
    /// </summary>
    public static readonly IReadOnlyCollection<int> ExpirationThresholdsDays = [30, 15, 7, 0];

    public const int DefaultExpiringWithinDays = 30;

    /// <summary>
    /// Opt-in flag in the <c>workforce</c> feature row's <c>ConfigurationJson</c>: when true, assigning
    /// a staff whose <c>License</c> qualification is expired is rejected.
    /// </summary>
    public const string BlockAssignmentOnExpiredLicenseKey = "blockAssignmentOnExpiredLicense";
}

public static class StaffAssignmentResourceTypes
{
    public const string Transporter = nameof(Transporter);
}
