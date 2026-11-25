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

using TrackHub.Router.Infrastructure.GpsGate.Mappers;
using TrackHub.Router.Domain.Interfaces;
using TrackHub.Router.Domain.Extensions;

namespace TrackHub.Router.Infrastructure.GpsGate;

public sealed class DeviceReader(
    ICredentialHttpClientFactory httpClientFactory, 
    IHttpClientService httpClientService)
    : GpsGateReaderBase(httpClientFactory, httpClientService), IExternalDeviceReader
{

    public async Task<DeviceVm> GetDeviceAsync(DeviceTransporterVm deviceDto, CancellationToken cancellationToken)
    {
        var url = $"api/v.1/{ApplicationId}/users/{UserId}/devices/{deviceDto.Identifier}";
        var device = await HttpClientService.GetAsync<Device>(url, cancellationToken: cancellationToken);
        return DeviceMapper.Instance.Map(device, deviceDto);
    }

    public async Task<IEnumerable<DeviceVm>> GetDevicesAsync(IEnumerable<DeviceTransporterVm> devices, CancellationToken cancellationToken)
    {
        var url = $"api/v.1/{ApplicationId}/users/{UserId}/devices";
        var result = await HttpClientService.GetAsync<IEnumerable<Device>>(url, cancellationToken: cancellationToken);
        if (result is null)
        {
            return [];
        }
        var devicesDictionary = devices.ToDeviceLookup(device => device.Identifier);
        return DeviceMapper.Instance.Map(result, devicesDictionary);
    }

    public async Task<IEnumerable<DeviceVm>> GetDevicesAsync(CancellationToken cancellationToken)
    {
        var url = $"api/v.1/{ApplicationId}/users/{UserId}/devices";
        var positions = await HttpClientService.GetAsync<IEnumerable<Device>>(url, cancellationToken: cancellationToken);
        return positions is null ? ([]) : DeviceMapper.Instance.Map(positions).Distinct();
    }
}
