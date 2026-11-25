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

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Common.Infrastructure;

/// <summary>
/// Normalizes every <see cref="DateTimeOffset"/> property to UTC before write, since Npgsql rejects
/// non-zero offsets for <c>timestamp with time zone</c>.
/// </summary>
public static class UtcTimestampConvention
{
    /// <summary>Call from <c>DbContext.ConfigureConventions</c>.</summary>
    public static ModelConfigurationBuilder UseUtcTimestamps(this ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<DateTimeOffset>().HaveConversion<UtcDateTimeOffsetConverter>();
        return configurationBuilder;
    }

    public sealed class UtcDateTimeOffsetConverter() : ValueConverter<DateTimeOffset, DateTimeOffset>(
        v => v.ToUniversalTime(),
        v => v);
}
