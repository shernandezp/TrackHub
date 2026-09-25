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

using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Npgsql;

namespace Common.Infrastructure.Tests;

public class DatabaseConnectionStringsTests
{
    private const string Raw = "server=localhost;user id=postgres;password=secret;database=TrackHub;port=5432";

    [Fact]
    public void Normalize_applies_the_platform_defaults()
    {
        var builder = new NpgsqlConnectionStringBuilder(DatabaseConnectionStrings.Normalize(Raw));

        builder.MaxPoolSize.Should().Be(DatabaseConnectionStrings.DefaultMaxPoolSize);
        builder.Timeout.Should().Be(DatabaseConnectionStrings.DefaultConnectTimeoutSeconds);
        builder.CommandTimeout.Should().Be(DatabaseConnectionStrings.DefaultCommandTimeoutSeconds);
        builder.MaxAutoPrepare.Should().Be(DatabaseConnectionStrings.DefaultMaxAutoPrepare);
        builder.AutoPrepareMinUsages.Should().Be(DatabaseConnectionStrings.DefaultAutoPrepareMinUsages);
        builder.Timezone.Should().Be(DatabaseConnectionStrings.DefaultTimezone);
        builder.Database.Should().Be("TrackHub");
    }

    [Fact]
    public void Normalize_keeps_every_value_the_connection_string_states()
    {
        var stated = $"{Raw};Maximum Pool Size=7;Timeout=3;Command Timeout=0;Max Auto Prepare=0;Auto Prepare Min Usages=9;Timezone=America/Bogota";

        var builder = new NpgsqlConnectionStringBuilder(DatabaseConnectionStrings.Normalize(stated));

        builder.MaxPoolSize.Should().Be(7);
        builder.Timeout.Should().Be(3);
        builder.CommandTimeout.Should().Be(0);
        builder.MaxAutoPrepare.Should().Be(0);
        builder.AutoPrepareMinUsages.Should().Be(9);
        builder.Timezone.Should().Be("America/Bogota");
    }

    [Fact]
    public void Normalize_reads_the_Database_section_when_the_connection_string_is_silent()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Database:MaxPoolSize"] = "35",
                ["Database:CommandTimeoutSeconds"] = "0",
            })
            .Build();

        var builder = new NpgsqlConnectionStringBuilder(DatabaseConnectionStrings.Normalize(Raw, configuration));

        builder.MaxPoolSize.Should().Be(35);
        builder.CommandTimeout.Should().Be(0);
        builder.MaxAutoPrepare.Should().Be(DatabaseConnectionStrings.DefaultMaxAutoPrepare);
    }

    [Fact]
    public void GetRequiredConnectionString_throws_when_the_name_is_missing()
    {
        var configuration = new ConfigurationBuilder().Build();

        var act = () => configuration.GetRequiredConnectionString("DefaultConnection");

        act.Should().Throw<InvalidOperationException>();
    }
}
