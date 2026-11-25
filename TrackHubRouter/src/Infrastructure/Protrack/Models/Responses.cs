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

namespace TrackHub.Router.Infrastructure.Protrack.Models;

internal sealed record AuthorizationResponse(
    int Code,
    AuthorizationRecord? Record
);

internal sealed record AuthorizationRecord(
    string Access_token,
    long Expires_in
);

internal sealed record TrackResponse(
    int Code,
    IEnumerable<TrackRecord>? Record
);

/// <summary>
/// Protrack playback response (historical positions as semicolon-separated string)
/// </summary>
internal sealed record PlaybackResponse(
    int Code,
    string? Record
);

internal sealed record DeviceListResponse(
    int Code,
    IEnumerable<DeviceRecord>? Record
);
