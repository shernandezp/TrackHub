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

using System.Text.Json;
using Common.Application.Interfaces;
using Common.Domain.Constants;
using Moq;
using TrackHub.Manager.Domain.Constants;
using TrackHub.Manager.Domain.Interfaces;
using TrackHub.Manager.Domain.Records;
using TrackHub.Manager.Infrastructure;
using TrackHub.Manager.Infrastructure.Interfaces;
using TrackHub.Manager.Infrastructure.ManagerDB.Readers;
using TrackHub.Manager.Infrastructure.ManagerDB.Writers;

namespace Infrastructure.UnitTests;

// Rules, deliveries, health and templates are administrative reads, and a rule's webhook signing
// secret never leaves the service: reads redact it and an update that omits it keeps the stored one.
[TestFixture]
public class NotificationAdminSurfaceTests
{
    private const string Selector = """{"roles":["Administrator"],"subscribers":false}""";

    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    private static ICurrentPrincipal Principal(Guid accountId, string? role)
    {
        var principal = new Mock<ICurrentPrincipal>();
        principal.SetupGet(p => p.AccountId).Returns(accountId);
        principal.SetupGet(p => p.PrincipalType).Returns(PrincipalType.User);
        principal.SetupGet(p => p.UserId).Returns(Guid.NewGuid());
        principal.SetupGet(p => p.Role).Returns(role);
        return principal.Object;
    }

    private static NotificationReader Reader(ApplicationDbContext context, ICurrentPrincipal principal)
        => new(context as IApplicationDbContext, principal, Mock.Of<IVisibleTransporterReader>());

    private static async Task<NotificationRule> SeedWebhookRuleAsync(ApplicationDbContext context, Guid accountId)
    {
        var rule = new NotificationRule(accountId, "hook", "Notifications", true, "TripStarted", Selector, """["Webhook"]""", null,
            """{"webhookUrl":"https://partner.example/hook","webhookSecret":"s3cret"}""");
        await context.NotificationRules.AddAsync(rule);
        await context.SaveChangesAsync(CancellationToken.None);
        return rule;
    }

    [Test]
    public async Task PlainUser_IsRefusedTheAdministrativeReads()
    {
        var accountId = Guid.NewGuid();
        await using var context = NewContext(nameof(PlainUser_IsRefusedTheAdministrativeReads));
        var reader = Reader(context, Principal(accountId, Roles.User));

        Assert.Multiple(() =>
        {
            Assert.ThrowsAsync<ForbiddenAccessException>(() => reader.GetNotificationRulesAsync(accountId, 0, 50, CancellationToken.None));
            Assert.ThrowsAsync<ForbiddenAccessException>(() => reader.GetNotificationDeliveriesAsync(accountId, null, null, null, null, 0, 50, CancellationToken.None));
            Assert.ThrowsAsync<ForbiddenAccessException>(() => reader.GetDeliveryHealthAsync(accountId, DateTimeOffset.UtcNow.AddDays(-1), DateTimeOffset.UtcNow, CancellationToken.None));
        });
    }

    [Test]
    public async Task RuleReads_RedactTheWebhookSecret()
    {
        var accountId = Guid.NewGuid();
        await using var context = NewContext(nameof(RuleReads_RedactTheWebhookSecret));
        await SeedWebhookRuleAsync(context, accountId);

        var rule = (await Reader(context, Principal(accountId, Roles.Manager)).GetNotificationRulesAsync(accountId, 0, 50, CancellationToken.None)).Items.Single();
        var configuration = JsonDocument.Parse(rule.ConfigurationJson!).RootElement;

        Assert.Multiple(() =>
        {
            Assert.That(rule.ConfigurationJson, Does.Not.Contain("s3cret"));
            Assert.That(configuration.GetProperty("webhookUrl").GetString(), Is.EqualTo("https://partner.example/hook"));
            Assert.That(configuration.GetProperty("webhookSecretSet").GetBoolean(), Is.True);
        });
    }

    [Test]
    public async Task Update_WithoutASecret_KeepsTheStoredOne()
    {
        var accountId = Guid.NewGuid();
        await using var context = NewContext(nameof(Update_WithoutASecret_KeepsTheStoredOne));
        var rule = await SeedWebhookRuleAsync(context, accountId);
        var writer = new NotificationWriter(context as IApplicationDbContext, Principal(accountId, Roles.Manager));

        await writer.UpdateNotificationRuleAsync(rule.NotificationRuleId,
            new NotificationRuleDto(accountId, "hook", "Notifications", true, "TripStarted", Selector, """["Webhook"]""", null,
                """{"webhookUrl":"https://partner.example/hook-v2","webhookSecretSet":true}"""),
            CancellationToken.None);

        var stored = JsonDocument.Parse((await context.NotificationRules.AsNoTracking().SingleAsync()).ConfigurationJson!).RootElement;
        Assert.Multiple(() =>
        {
            Assert.That(stored.GetProperty("webhookUrl").GetString(), Is.EqualTo("https://partner.example/hook-v2"));
            Assert.That(stored.GetProperty("webhookSecret").GetString(), Is.EqualTo("s3cret"));
            Assert.That(stored.TryGetProperty("webhookSecretSet", out _), Is.False);
        });
    }

    [Test]
    public async Task Update_ThatSelectsWebhookWithNoSecretAnywhere_IsRefused()
    {
        var accountId = Guid.NewGuid();
        await using var context = NewContext(nameof(Update_ThatSelectsWebhookWithNoSecretAnywhere_IsRefused));
        var rule = new NotificationRule(accountId, "mail", "Notifications", true, "TripStarted", Selector, """["Email"]""", null, null);
        await context.NotificationRules.AddAsync(rule);
        await context.SaveChangesAsync(CancellationToken.None);
        var writer = new NotificationWriter(context as IApplicationDbContext, Principal(accountId, Roles.Manager));

        Assert.ThrowsAsync<ValidationException>(() => writer.UpdateNotificationRuleAsync(rule.NotificationRuleId,
            new NotificationRuleDto(accountId, "mail", "Notifications", true, "TripStarted", Selector, """["Webhook"]""", null,
                """{"webhookUrl":"https://partner.example/hook"}"""),
            CancellationToken.None));
    }
}
