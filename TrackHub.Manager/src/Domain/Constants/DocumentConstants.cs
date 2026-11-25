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

public static class DocumentStatuses
{
    public const string Pending = nameof(Pending);
    public const string Uploaded = nameof(Uploaded);
    public const string Active = nameof(Active);
    public const string Expired = nameof(Expired);
    public const string Replaced = nameof(Replaced);
    public const string Voided = nameof(Voided);
    public const string Deleted = nameof(Deleted);

    public static bool IsServable(string? status) => status is Active or Expired;

    public static readonly IReadOnlyCollection<string> All =
        [Pending, Uploaded, Active, Expired, Replaced, Voided, Deleted];

    public static bool IsValid(string? value) => value != null && All.Contains(value);
}

public static class DocumentScanStatuses
{
    public const string Pending = nameof(Pending);
    public const string Quarantined = nameof(Quarantined);
    public const string Clean = Common.Domain.Evidence.DocumentScan.Clean;
    public const string NotScanned = Common.Domain.Evidence.DocumentScan.NotScanned;
    public const string Infected = nameof(Infected);
    public const string Failed = nameof(Failed);

    public static readonly IReadOnlyCollection<string> All =
        [Pending, Quarantined, Clean, NotScanned, Infected, Failed];

    public static bool IsValid(string? value) => value != null && All.Contains(value);

    public static bool IsServable(string? value) => Common.Domain.Evidence.DocumentScan.IsServable(value);
}

public static class DocumentVisibilityScopes
{
    public const string Owner = nameof(Owner);
}

public static class DocumentClassifications
{
    public const string Public = nameof(Public);
    public const string Internal = nameof(Internal);
    public const string Confidential = nameof(Confidential);
    public const string Legal = nameof(Legal);

    public static readonly IReadOnlyCollection<string> All =
        [Public, Internal, Confidential, Legal];

    public static string? Normalize(string? value)
        => All.FirstOrDefault(known => string.Equals(known, value?.Trim(), StringComparison.OrdinalIgnoreCase));

    public static bool IsValid(string? value) => value != null && All.Contains(value);

    /// <summary>Confidential/Legal require an explicit clearance beyond plain Documents/Read.</summary>
    public static bool IsSensitive(string? classification)
        => string.Equals(classification, Confidential, StringComparison.OrdinalIgnoreCase)
           || string.Equals(classification, Legal, StringComparison.OrdinalIgnoreCase);
}

/// <summary>
/// Owner entity types with a registered visibility resolver; unlisted types are deny-by-default.
/// <para>
/// There is deliberately no <c>"Trip"</c> owner type: trip documents are owned by the trip's
/// transporter, and resolving a Trip owner would make Manager depend on TripManagement, inverting
/// the dependency direction. Do not add one.
/// </para>
/// </summary>
public static class DocumentOwnerTypes
{
    public const string Transporter = nameof(Transporter);
    public const string Staff = nameof(Staff);

    public static bool IsRegistered(string? ownerEntityType)
        => string.Equals(ownerEntityType, Transporter, StringComparison.OrdinalIgnoreCase)
           || string.Equals(ownerEntityType, Staff, StringComparison.OrdinalIgnoreCase);
}

public static class DocumentSharing
{
    public const string ResourceType = "Document";
    public const string ReadScope = "document.read";
}

/// <summary>Platform file-size ceilings. Modules may lower, never exceed.</summary>
public static class DocumentLimits
{
    public const long DefaultMaxBytes = 25L * 1024 * 1024;          // 25 MB per photo/document
    public const long ImportExportMaxBytes = 100L * 1024 * 1024;    // 100 MB import/export/generated

    public static readonly IReadOnlyCollection<int> ExpirationThresholdsDays = [30, 15, 7];
}
