using System.Globalization;
using System.Text.Json;
using Common.Application.Interfaces;
using Common.Domain.Enums;
using Moq;
using TrackHub.Manager.Domain.Records;
using TrackHub.Manager.Infrastructure;

namespace Infrastructure.UnitTests;

/// <summary>
/// Audit payloads are hand-built JSON. A value interpolated without quoting, or a number formatted
/// in the ambient culture, produces a row no downstream consumer can parse — and the audit trail is
/// the record a tenant's compliance claim rests on, so it fails silently exactly when it matters.
/// </summary>
[TestFixture]
public class AuditPayloadJsonTests
{
    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    private static ICurrentPrincipal Principal(Guid accountId)
    {
        var principal = new Mock<ICurrentPrincipal>();
        principal.SetupGet(p => p.AccountId).Returns(accountId);
        principal.SetupGet(p => p.PrincipalType).Returns(PrincipalType.User);
        principal.SetupGet(p => p.UserId).Returns(Guid.NewGuid());
        return principal.Object;
    }

    private static void AssertPayloadsParse(ApplicationDbContext context)
    {
        var events = context.AuditEvents.AsNoTracking().ToList();
        Assert.That(events, Is.Not.Empty, "the mutation must have recorded an audit event");

        foreach (var audited in events)
        {
            foreach (var payload in new[] { audited.OldValuesJson, audited.NewValuesJson })
            {
                if (payload is null)
                {
                    continue;
                }

                Assert.DoesNotThrow(
                    () => JsonDocument.Parse(payload).Dispose(),
                    $"{audited.Action} wrote a payload that is not JSON: {payload}");
            }
        }
    }

    [Test]
    [SetCulture("es-ES")]
    public async Task TransporterType_PayloadIsJson_EvenUnderACommaDecimalCulture()
    {
        await using var context = NewContext(nameof(TransporterType_PayloadIsJson_EvenUnderACommaDecimalCulture));
        Assume.That(CultureInfo.CurrentCulture.NumberFormat.NumberDecimalSeparator, Is.EqualTo(","));

        var transporterType = new TrackHub.Manager.Infrastructure.Entities.TransporterType(7, true, 1.5, 2.5, 3.5);
        await context.TransporterTypes.AddAsync(transporterType);
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new TrackHub.Manager.Infrastructure.Writers.TransporterTypeWriter(context, Principal(Guid.NewGuid()));
        await writer.UpdateTransporterTypeAsync(
            new TransporterTypeDto(transporterType.TransporterTypeId, false, 4.5, 5.5, 6.5), CancellationToken.None);

        AssertPayloadsParse(context);
    }
}
