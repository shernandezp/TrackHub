using Npgsql;

namespace Common.Infrastructure.Tests;

// A throwaway database per test on the developer's local instance; tests skip when none answers.
internal static class LocalPostgres
{
    public static async Task<string?> ConnectionAsync()
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

    public static async Task<(string Connection, Func<Task> Drop)> CreateDatabaseAsync(string admin, string prefix)
    {
        var database = $"{prefix}_{Guid.NewGuid():N}";
        await ExecuteAsync(admin, $"CREATE DATABASE \"{database}\"");
        var connection = new NpgsqlConnectionStringBuilder(admin) { Database = database }.ConnectionString;
        return (connection, async () =>
        {
            NpgsqlConnection.ClearAllPools();
            await ExecuteAsync(admin, $"DROP DATABASE IF EXISTS \"{database}\" WITH (FORCE)");
        });
    }

    public static async Task ExecuteAsync(string connectionString, string sql)
    {
        await using var connection = new NpgsqlConnection(connectionString);
        await connection.OpenAsync(TestContext.Current.CancellationToken);
        await using var command = new NpgsqlCommand(sql, connection);
        await command.ExecuteNonQueryAsync(TestContext.Current.CancellationToken);
    }
}
