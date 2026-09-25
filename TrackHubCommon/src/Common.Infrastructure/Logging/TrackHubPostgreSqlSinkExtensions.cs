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

using Common.Infrastructure.Logging;
using Microsoft.Extensions.Configuration;
using NpgsqlTypes;
using Serilog.Configuration;
using Serilog.Events;
using Serilog.Sinks.PostgreSQL;

namespace Serilog;

/// <summary>
/// The platform's database log sink: <c>WriteTo: [{ "Name": "TrackHubPostgreSQL", "Args": {
/// "connectionString": "Logging" } }]</c>. The column set lives here rather than in every
/// service's appsettings, and <c>raise_date</c> is a UTC instant whatever zone the process runs in.
/// </summary>
public static class TrackHubPostgreSqlSinkExtensions
{
    public const string TableName = "logs";

    public static LoggerConfiguration TrackHubPostgreSQL(
        this LoggerSinkConfiguration sinkConfiguration,
        IConfiguration configuration,
        string connectionString,
        LogEventLevel restrictedToMinimumLevel = LevelAlias.Minimum,
        int batchSizeLimit = 50,
        TimeSpan? period = null)
    {
        ArgumentNullException.ThrowIfNull(sinkConfiguration);
        ArgumentException.ThrowIfNullOrWhiteSpace(connectionString);

        var resolved = configuration?.GetConnectionString(connectionString) ?? connectionString;

        return sinkConfiguration.PostgreSQL(
            resolved,
            TableName,
            Columns(),
            restrictedToMinimumLevel,
            period ?? TimeSpan.FromSeconds(2),
            batchSizeLimit: batchSizeLimit,
            needAutoCreateTable: true);
    }

    public static IDictionary<string, ColumnWriterBase> Columns() => new Dictionary<string, ColumnWriterBase>
    {
        ["message"] = new RenderedMessageColumnWriter(),
        ["message_template"] = new MessageTemplateColumnWriter(),
        ["level"] = new LevelColumnWriter(true, NpgsqlDbType.Varchar),
        ["raise_date"] = new UtcTimestampColumnWriter(),
        ["exception"] = new ExceptionColumnWriter(),
        ["properties"] = new LogEventSerializedColumnWriter(),
        ["machine_name"] = new SinglePropertyColumnWriter("MachineName", PropertyWriteMethod.Raw),
        ["application"] = new SinglePropertyColumnWriter("Application", PropertyWriteMethod.Raw),
        ["environment_name"] = new SinglePropertyColumnWriter("EnvironmentName", PropertyWriteMethod.Raw),
    };
}
