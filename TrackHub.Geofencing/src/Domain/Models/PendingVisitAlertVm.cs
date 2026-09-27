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

namespace TrackHub.Geofencing.Domain.Models;

/// <summary>A visit whose entry or exit alert has not reached Manager yet.</summary>
public readonly record struct PendingVisitAlertVm(
    Guid GeofenceEventId,
    Guid AccountId,
    Guid TransporterId,
    Guid GeofenceId,
    string GeofenceName,
    short GeofenceType,
    DateTimeOffset EventDateTime,
    DateTimeOffset? DepartureTimestamp,
    double Latitude,
    double Longitude,
    bool EntryPending,
    bool AlertOnEntry,
    bool ExitPending,
    bool AlertOnExit);
