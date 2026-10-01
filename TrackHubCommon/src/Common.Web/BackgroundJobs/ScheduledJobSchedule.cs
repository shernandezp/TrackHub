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

using Common.Application.BackgroundJobs;

namespace Common.Web.BackgroundJobs;

// Per-registration schedule: an interval from configuration instead of the job's static default, and
// a last cycle at shutdown for jobs that hold work in memory.
public sealed record ScheduledJobSchedule<TJob>(TimeSpan? Interval = null, bool RunOnStop = false)
    where TJob : class, IScheduledJob;
