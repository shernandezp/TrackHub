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

using TrackHub.Router.Domain.Models;

namespace TrackHub.Router.Domain.Helpers;

/// <summary>
/// The single rule for whether a provider fix may be stored. Every ingestion path shares it so the
/// copies cannot drift.
/// </summary>
public static class PositionValidity
{
    // A fix dated further ahead than this is the device's clock, not the truth. Stored, it would win
    // the latest-position comparison permanently and freeze that transporter's map pin.
    private static readonly TimeSpan MaxClockSkewAhead = TimeSpan.FromMinutes(15);

    public static bool IsStorable(PositionVm position)
        => position.TransporterId != Guid.Empty
           && HasCoordinates(position.Latitude, position.Longitude)
           && IsWithinClockWindow(position.DeviceDateTime);

    public static bool HasCoordinates(double latitude, double longitude)
        => latitude is >= -90d and <= 90d
           && longitude is >= -180d and <= 180d
           // Null island is what a device emits when it has no fix at all.
           && (latitude != 0d || longitude != 0d);

    public static bool IsWithinClockWindow(DateTimeOffset deviceDateTime)
    {
        if (deviceDateTime == default)
        {
            return false;
        }

        // Only the future is bounded: a vehicle parked for a week still reports that week-old fix as
        // its last known position, and that is a legitimate latest position.
        return deviceDateTime <= DateTimeOffset.UtcNow + MaxClockSkewAhead;
    }
}
