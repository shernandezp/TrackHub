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

namespace TrackHub.Geofencing.Infrastructure.Readers;

public sealed class LocalGeocoder(ApplicationDbContext context) : ILocalGeocoder
{
    public async Task<AddressVm?> ReverseGeocodeAsync(double latitude, double longitude, CancellationToken cancellationToken)
        => await context.Database
            .SqlQuery<AddressVm>($"SELECT address AS \"Address\", city AS \"City\", state AS \"State\", country AS \"Country\" FROM geocoding.reverse_geocode({latitude}, {longitude})")
            .FirstOrDefaultAsync(cancellationToken);
}
