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

namespace TrackHub.Router.Infrastructure.CommandTrack;

using TrackHub.Router.Domain.Interfaces;
using TrackHub.Router.Domain.Models;
using TrackHub.Router.Infrastructure.CommandTrack.Mappers;
using Common.Domain.Extensions;
using TrackHub.Router.Domain.Extensions;
using TrackHub.Router.Domain.Interfaces.Manager;
using TrackHub.Router.Domain.Interfaces.Operator;
using TrackHub.Router.Domain.Helpers;

public sealed class PositionReader(ICredentialHttpClientFactory httpClientFactory,
    IHttpClientService httpClientService,
    ICredentialWriter credentialWriter,
    IProviderSessionStore sessionStore
    ) : CommandTrackReaderBase(httpClientFactory, httpClientService, credentialWriter, sessionStore), IPositionReader
{
    public async Task<PositionVm> GetDevicePositionAsync(DeviceTransporterVm deviceDto, CancellationToken cancellationToken)
    {
        var position = await WithReauthenticationAsync(
            () => HttpClientService.GetAsync<DevicePosition>($"DataConnectAPI/api/Device/{deviceDto.Identifier}", Header, cancellationToken),
            cancellationToken);
        return position.MapToPositionVm(deviceDto);
    }

    public async Task<IEnumerable<PositionVm>> GetDevicePositionAsync(IEnumerable<DeviceTransporterVm> devices, CancellationToken cancellationToken)
    {
        // Materialised once: the list is walked twice below, and the caller's sequence may not be
        // replayable. The REQUEST is keyed by identifier while the mapping is keyed by name, so the
        // chunks come from the list rather than the lookup — deduplicating names must not drop a
        // device from the query and leave it without a position.
        var devicesList = devices as IReadOnlyList<DeviceTransporterVm> ?? [.. devices];

        // Names are not unique in the catalog; the first row wins rather than the whole read failing.
        var devicesDictionary = devicesList.ToDeviceLookup(device => device.Name);
        var results = new List<PositionVm>();
        foreach (var chunk in devicesList.Chunk(ProviderBatching.MaxIdsPerRequest))
        {
            var ids = chunk.GetIdsQueryString();
            var positions = await WithReauthenticationAsync(
                () => HttpClientService.GetAsync<IEnumerable<DevicePosition>>($"DataConnectAPI/api/Devices?{ids}", Header, cancellationToken),
                cancellationToken);
            if (positions is not null)
            {
                results.AddRange(positions.MapToPositionVm(devicesDictionary));
            }
        }
        return results.Distinct();
    }

    public async Task<IEnumerable<PositionVm>> GetPositionAsync(DateTimeOffset from, DateTimeOffset to, DeviceTransporterVm deviceDto, CancellationToken cancellationToken)
    {
        var url = $"DataConnectAPI/api/Position/{deviceDto.Name}/{from.ToIso8601String()}/{to.ToIso8601String()}";
        var positions = await WithReauthenticationAsync(
            () => HttpClientService.GetAsync<IEnumerable<Position>>(url, Header, cancellationToken),
            cancellationToken);
        return positions is null ? ([]) : positions.MapToPositionVm(deviceDto);
    }
}
