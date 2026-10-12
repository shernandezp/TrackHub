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

namespace TrackHub.Geofencing.Application.Geocoding.Queries.ReverseGeocode;

[Authorize(Resource = Resources.GeocodingProviders, Action = Actions.Read, PrincipalTypes = "ServiceClient")]
[PlatformScoped("Platform reference data for the Local geocoding provider, consumed by the Router geocoding adapter under its global service identity. No tenant owns a row.")]
public readonly record struct ReverseGeocodeQuery(double Latitude, double Longitude) : IRequest<AddressVm?>;

public class ReverseGeocodeQueryHandler(ILocalGeocoder geocoder) : IRequestHandler<ReverseGeocodeQuery, AddressVm?>
{
    public async Task<AddressVm?> Handle(ReverseGeocodeQuery request, CancellationToken cancellationToken)
        => await geocoder.ReverseGeocodeAsync(request.Latitude, request.Longitude, cancellationToken);
}
