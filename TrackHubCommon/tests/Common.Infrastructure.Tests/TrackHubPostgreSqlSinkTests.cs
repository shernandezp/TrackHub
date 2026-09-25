using Common.Infrastructure.Logging;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Serilog;
using Serilog.Events;

namespace Common.Infrastructure.Tests;

public class TrackHubPostgreSqlSinkTests
{
    [Fact]
    public void The_sink_is_reachable_from_the_Serilog_configuration_section()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Logging"] = "Host=localhost;Database=TrackHubLogs;Username=postgres;Password=x",
                ["Serilog:Using:0"] = "Common.Infrastructure",
                ["Serilog:WriteTo:0:Name"] = "TrackHubPostgreSQL",
                ["Serilog:WriteTo:0:Args:connectionString"] = "Logging",
                ["Serilog:WriteTo:0:Args:restrictedToMinimumLevel"] = "Warning",
            })
            .Build();

        var create = () => new LoggerConfiguration().ReadFrom.Configuration(configuration).CreateLogger().Dispose();

        create.Should().NotThrow();
    }

    [Fact]
    public void Raise_date_is_the_UTC_instant_whatever_the_process_zone_is()
    {
        var at = new DateTimeOffset(2026, 9, 24, 23, 30, 0, TimeSpan.FromHours(-5));
        var logEvent = new LogEvent(at, LogEventLevel.Warning, null, MessageTemplate.Empty, []);

        var value = new UtcTimestampColumnWriter().GetValue(logEvent);

        value.Should().Be(new DateTime(2026, 9, 25, 4, 30, 0, DateTimeKind.Utc));
        ((DateTime)value).Kind.Should().Be(DateTimeKind.Utc);
    }

    [Fact]
    public async Task A_logged_event_lands_as_a_timestamptz_instant_in_PostgreSQL()
    {
        var admin = await LocalPostgresAsync();
        Assert.SkipWhen(admin is null, "No local Postgres answered (set COMMON_TEST_CONNECTION, or run the local instance).");

        var database = $"sink_tests_{Guid.NewGuid():N}";
        await ExecuteAsync(admin!, $"CREATE DATABASE \"{database}\"");
        var connection = new NpgsqlConnectionStringBuilder(admin) { Database = database }.ConnectionString;
        try
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?> { ["ConnectionStrings:Logging"] = connection })
                .Build();
            var before = DateTimeOffset.UtcNow;
            using (var logger = new LoggerConfiguration()
                       .WriteTo.TrackHubPostgreSQL(configuration, "Logging", period: TimeSpan.FromMilliseconds(100))
                       .CreateLogger())
            {
                logger.Warning("sink probe");
            }

            await using var read = new NpgsqlConnection(new NpgsqlConnectionStringBuilder(connection) { Timezone = "America/Bogota" }.ConnectionString);
            await read.OpenAsync(TestContext.Current.CancellationToken);
            await using var command = new NpgsqlCommand(
                "SELECT raise_date, format_type(a.atttypid, a.atttypmod) FROM public.logs, pg_attribute a WHERE a.attrelid = 'public.logs'::regclass AND a.attname = 'raise_date'", read);
            await using var reader = await command.ExecuteReaderAsync(TestContext.Current.CancellationToken);
            (await reader.ReadAsync(TestContext.Current.CancellationToken)).Should().BeTrue("the batch must have been flushed on dispose");
            reader.GetString(1).Should().Be("timestamp with time zone");
            var stored = reader.GetFieldValue<DateTime>(0);
            stored.Kind.Should().Be(DateTimeKind.Utc);
            stored.Should().BeCloseTo(before.UtcDateTime, TimeSpan.FromMinutes(1));
        }
        finally
        {
            NpgsqlConnection.ClearAllPools();
            await ExecuteAsync(admin!, $"DROP DATABASE IF EXISTS \"{database}\" WITH (FORCE)");
        }
    }

    private static async Task<string?> LocalPostgresAsync()
    {
        var candidates = new List<string>();
        var explicitConnection = Environment.GetEnvironmentVariable("COMMON_TEST_CONNECTION");
        if (!string.IsNullOrWhiteSpace(explicitConnection))
        {
            candidates.Add(explicitConnection);
        }
        candidates.Add("Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=super;Timeout=3");
        candidates.Add("Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=postgres;Timeout=3");

        foreach (var candidate in candidates)
        {
            try
            {
                await using var connection = new NpgsqlConnection(candidate);
                await connection.OpenAsync(TestContext.Current.CancellationToken);
                return candidate;
            }
            catch (Exception)
            {
            }
        }
        return null;
    }

    private static async Task ExecuteAsync(string connectionString, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync(TestContext.Current.CancellationToken);
    }
}
