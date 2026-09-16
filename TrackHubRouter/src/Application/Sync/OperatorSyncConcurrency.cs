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

using Microsoft.Extensions.Configuration;

namespace TrackHub.Router.Application.Sync;

/// <summary>
/// Global cap on concurrent per-operator provider calls across all accounts in one cycle, shared by
/// the position, device-sync and health loops so their combined fan-out stays bounded fleet-wide.
/// </summary>
public static class OperatorSyncConcurrency
{
    public const int Default = 10;

    public static int Resolve(IConfiguration configuration)
        => int.TryParse(configuration["AppSettings:MaxConcurrentOperatorSyncs"], out var configured) && configured > 0
            ? configured
            : Default;
}
