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

using NpgsqlTypes;
using Serilog.Events;
using Serilog.Sinks.PostgreSQL;

namespace Common.Infrastructure.Logging;

/// <summary>
/// Writes the event instant as UTC into a <c>timestamp with time zone</c> column. The sink's own
/// writer emits the process's local wall clock, which only means UTC while the process runs in UTC.
/// </summary>
public sealed class UtcTimestampColumnWriter() : ColumnWriterBase(NpgsqlDbType.TimestampTz)
{
    public override object GetValue(LogEvent logEvent, IFormatProvider? formatProvider = null)
        => logEvent.Timestamp.UtcDateTime;
}
