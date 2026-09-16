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

using Common.Domain.Extensions;
using TrackHub.Router.Infrastructure.Traccar.Mappers;
using TrackHub.Router.Domain.Extensions;
using TrackHub.Router.Domain.Interfaces;
using TrackHub.Router.Domain.Helpers;

namespace TrackHub.Router.Infrastructure.Traccar;

// This class represents a reader for retrieving position information from Traccar.
public sealed class PositionReader(
    ICredentialHttpClientFactory httpClientFactory,
    IHttpClientService httpClientService) : TraccarReaderBase(httpClientFactory, httpClientService), IPositionReader
{
    /// <summary>
    /// Retrieves the position of a single device asynchronously.
    /// </summary>
    /// <param name="deviceDto"></param>
    /// <param name="cancellationToken"></param>
    /// <returns>The position view model of the device.</returns>
    public async Task<PositionVm> GetDevicePositionAsync(DeviceTransporterVm deviceDto, CancellationToken cancellationToken)
    {
        var url = $"api/positions?id={deviceDto.Identifier}";
        var position = await HttpClientService.GetAsync<Position>(url, cancellationToken: cancellationToken);
        return position.MapToPositionVm(deviceDto);
    }

    /// <summary>
    /// Retrieves the positions of multiple devices asynchronously.
    /// </summary>
    /// <param name="devices"></param>
    /// <param name="cancellationToken"></param>
    /// <returns>The collection of position view models of the devices.</returns>
    public async Task<IEnumerable<PositionVm>> GetDevicePositionAsync(IEnumerable<DeviceTransporterVm> devices, CancellationToken cancellationToken)
    {
        //Traccar does not have a method to retrieve the last position of multiple devices at once
        //So we need to retrieve the position id from the devices first
        var devicesDictionary = devices.ToDeviceLookup(device => device.Identifier);
        var positionIds = new List<int>();
        foreach (var chunk in devicesDictionary.Values.Chunk(ProviderBatching.MaxIdsPerRequest))
        {
            var url = $"api/devices?{chunk.GetIdsQueryString()}";
            var result = await HttpClientService.GetAsync<IEnumerable<Device>>(url, cancellationToken: cancellationToken);
            if (result is not null)
            {
                positionIds.AddRange(result.Select(x => x.PositionId));
            }
        }

        var results = new List<PositionVm>();
        foreach (var chunk in positionIds.Chunk(ProviderBatching.MaxIdsPerRequest))
        {
            var url = $"api/positions?{chunk.GetIdsQueryString()}";
            var positions = await HttpClientService.GetAsync<IEnumerable<Position>>(url, cancellationToken: cancellationToken);
            if (positions is not null)
            {
                results.AddRange(positions.MapToPositionVm(devicesDictionary));
            }
        }
        return results.Distinct();
    }

    /// <summary>
    /// Retrieves the positions of a device within a specified time range asynchronously.
    /// </summary>
    /// <param name="from"></param>
    /// <param name="to"></param>
    /// <param name="deviceDto"></param>
    /// <param name="cancellationToken"></param>
    /// <returns>The collection of position view models of the device within the specified time range.</returns>
    public async Task<IEnumerable<PositionVm>> GetPositionAsync(DateTimeOffset from, DateTimeOffset to, DeviceTransporterVm deviceDto, CancellationToken cancellationToken)
    {
        var url = $"api/positions?deviceId={deviceDto.Identifier}&from={from.ToIso8601String()}&to={to.ToIso8601String()}";
        var positions = await HttpClientService.GetAsync<IEnumerable<Position>>(url, cancellationToken: cancellationToken);
        return positions is null ? ([]) : positions.MapToPositionVm(deviceDto);
    }
}
