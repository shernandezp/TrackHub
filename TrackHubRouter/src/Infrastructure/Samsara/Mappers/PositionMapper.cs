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

namespace TrackHub.Router.Infrastructure.Samsara.Mappers;

internal static class PositionMapper
{
    private const double MphToKmh = 1.60934;

    public static PositionVm MapToPositionVm(this VehicleStats vehicle, DeviceTransporterVm deviceDto)
    {
        var gps = vehicle.Gps;
        return new PositionVm(
            deviceDto.TransporterId,
            deviceDto.Name,
            deviceDto.TransporterType,
            gps?.Latitude ?? 0,
            gps?.Longitude ?? 0,
            null,  // Samsara doesn't provide altitude in basic GPS data
            gps?.Time ?? DateTimeOffset.MinValue,
            null,
            (gps?.SpeedMilesPerHour ?? 0) * MphToKmh,  // Convert to km/h
            gps?.HeadingDegrees,
            null,
            gps?.ReverseGeo?.FormattedLocation,
            null,
            null,
            null,
            null
        );
    }

    public static PositionVm MapToPositionVm(this GpsData gps, DeviceTransporterVm deviceDto)
        => new(
            deviceDto.TransporterId,
            deviceDto.Name,
            deviceDto.TransporterType,
            gps.Latitude,
            gps.Longitude,
            null,  // Samsara doesn't provide altitude in basic GPS data
            gps.Time,
            null,
            gps.SpeedMilesPerHour * MphToKmh,  // Convert to km/h
            gps.HeadingDegrees,
            null,
            gps.ReverseGeo?.FormattedLocation,
            null,
            null,
            null,
            null
        );

    public static IEnumerable<PositionVm> MapToPositionVm(this IEnumerable<VehicleStats> vehicles, IDictionary<string, DeviceTransporterVm> devicesDictionary)
    {
        foreach (var vehicle in vehicles)
        {
            if (vehicle.Gps.HasValue && devicesDictionary.TryGetValue(vehicle.Id, out var device))
            {
                yield return vehicle.MapToPositionVm(device);
            }
        }
    }

    public static IEnumerable<PositionVm> MapToPositionVm(this VehicleHistory vehicle, DeviceTransporterVm deviceDto)
    {
        if (vehicle.Gps is null)
        {
            yield break;
        }

        foreach (var gps in vehicle.Gps)
        {
            yield return gps.MapToPositionVm(deviceDto);
        }
    }
}
