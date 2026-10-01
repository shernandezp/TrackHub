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

public static class OperatorSyncBackoffPolicy
{
    private static readonly TimeSpan BaseDelay = TimeSpan.FromMinutes(1);
    private static readonly TimeSpan MaxDelay = TimeSpan.FromMinutes(30);

    public static bool IsInBackoff(OperatorVm @operator, DateTimeOffset now)
        => @operator.SyncRetryAt is { } retryAt && now < retryAt;

    // 1,2,4,8,16,30,30... minutes (capped). The shift is bounded so a long-running poison-pill
    // operator never overflows it.
    public static DateTimeOffset NextRetryAt(int consecutiveFailures, DateTimeOffset now)
    {
        var scaled = TimeSpan.FromTicks(BaseDelay.Ticks << Math.Min(consecutiveFailures - 1, 5));
        return now + (scaled < MaxDelay ? scaled : MaxDelay);
    }
}
