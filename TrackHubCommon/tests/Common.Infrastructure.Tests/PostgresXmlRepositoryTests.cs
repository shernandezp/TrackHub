using System.Xml.Linq;
using Common.Infrastructure.DataProtection;
using FluentAssertions;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.Extensions.DependencyInjection;

namespace Common.Infrastructure.Tests;

public class PostgresXmlRepositoryTests
{
    [Fact]
    public async Task Elements_round_trip_and_the_table_is_created_on_first_use()
    {
        var admin = await LocalPostgres.ConnectionAsync();
        Assert.SkipWhen(admin is null, "No local Postgres answered (set COMMON_TEST_CONNECTION, or run the local instance).");
        var (connection, drop) = await LocalPostgres.CreateDatabaseAsync(admin!, "dataprotection_tests");
        try
        {
            var repository = new PostgresXmlRepository(connection);
            repository.StoreElement(new XElement("key", new XAttribute("id", "1")), "key-1");
            repository.StoreElement(new XElement("revocation"), null!);

            var stored = new PostgresXmlRepository(connection).GetAllElements();

            stored.Select(e => e.Name.LocalName).Should().Equal("key", "revocation");
            stored.First().Attribute("id")!.Value.Should().Be("1");
        }
        finally
        {
            await drop();
        }
    }

    [Fact]
    public async Task A_payload_protected_by_one_process_is_readable_by_the_next()
    {
        var admin = await LocalPostgres.ConnectionAsync();
        Assert.SkipWhen(admin is null, "No local Postgres answered (set COMMON_TEST_CONNECTION, or run the local instance).");
        var (connection, drop) = await LocalPostgres.CreateDatabaseAsync(admin!, "dataprotection_tests");
        try
        {
            var protectedText = Protector(connection).Protect("hello");

            Protector(connection).Unprotect(protectedText).Should().Be("hello");
        }
        finally
        {
            await drop();
        }
    }

    // Each call is a fresh container: a new process reading the same key ring.
    private static IDataProtector Protector(string connection)
    {
        var services = new ServiceCollection();
        services.AddDataProtection().SetApplicationName("tests");
        services.Configure<KeyManagementOptions>(options => options.XmlRepository = new PostgresXmlRepository(connection));
        return services.BuildServiceProvider().GetRequiredService<IDataProtectionProvider>().CreateProtector("round-trip");
    }
}
