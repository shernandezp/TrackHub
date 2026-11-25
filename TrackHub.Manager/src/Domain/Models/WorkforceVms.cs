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

namespace TrackHub.Manager.Domain.Models;

/// <summary>
/// <paramref name="Status"/> carries only the stored lifecycle state; expiry is derived by the
/// consumer from <paramref name="ExpiresAt"/>.
/// </summary>
public readonly record struct StaffQualificationVm(
    Guid StaffQualificationId,
    Guid AccountId,
    Guid StaffId,
    string StaffName,
    string QualificationType,
    string? Category,
    string? Number,
    DateOnly? IssuedAt,
    DateOnly? ExpiresAt,
    string? IssuingAuthority,
    string Status,
    Guid? DocumentId,
    string? Notes,
    DateTimeOffset LastModified);

public readonly record struct StaffTransporterAssignmentVm(
    Guid StaffTransporterAssignmentId,
    Guid AccountId,
    Guid StaffId,
    string StaffName,
    Guid TransporterId,
    string TransporterName,
    DateTimeOffset StartsAt,
    DateTimeOffset? EndsAt,
    string AssignmentType,
    string Status,
    string CreatedByPrincipal,
    DateTimeOffset LastModified);

/// <summary>
/// The handler pins the staff id from the principal, so this never carries another staff's data.
/// </summary>
public readonly record struct MyStaffProfileVm(
    StaffMemberVm Staff,
    IReadOnlyCollection<StaffQualificationVm> Qualifications,
    IReadOnlyCollection<StaffTransporterAssignmentVm> ActiveAssignments);
