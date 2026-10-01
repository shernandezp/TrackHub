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

namespace Common.Domain.Helpers;

/// <summary>
/// Wall-clock conversions for external services that speak a known fixed UTC offset
/// (rules.md → Timestamps: "a provider with a known fixed zone may hardcode the
/// conversion in its own mapper"). Request dates go out as the service's wall time;
/// response dates come back naive and are pinned to the service's offset.
/// </summary>
public static class FixedOffsetTime
{
    /// <summary>The service-zone wall-clock time of a UTC instant.</summary>
    public static DateTime ToWallClock(DateTimeOffset instant, TimeSpan offset)
        => instant.ToOffset(offset).DateTime;

    /// <summary>The UTC instant of a naive service wall-clock time.</summary>
    public static DateTimeOffset FromWallClock(DateTime wallClock, TimeSpan offset)
        => new DateTimeOffset(DateTime.SpecifyKind(wallClock, DateTimeKind.Unspecified), offset).ToUniversalTime();
}
