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

using Microsoft.Extensions.Logging;
using TrackHub.Manager.Application.BackgroundJobs;
using TrackHub.Manager.Domain.Constants;
using TrackHub.Manager.Domain.Interfaces;
using TrackHub.Manager.Domain.Records;
using Common.Domain.Constants;
using Common.Domain.Time;

namespace Application.UnitTests.BackgroundJobs;

// Digest folding had no unit-test surface while it lived in the Web layer against a raw DbContext.
[TestFixture]
public class NotificationDigestJobTests
{
    private static readonly Guid AccountId = Guid.NewGuid();
    private static readonly Guid RuleId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 9, 14, 12, 0, 0, TimeSpan.Zero);

    private Mock<INotificationDigestStore> _store = null!;
    private Mock<IAccountFeatureGate> _features = null!;
    private Mock<INotificationRenderer> _renderer = null!;

    [SetUp]
    public void SetUp()
    {
        _store = new Mock<INotificationDigestStore>();
        _features = new Mock<IAccountFeatureGate>();
        _renderer = new Mock<INotificationRenderer>();

        _store.Setup(s => s.GetAccountsWithDeferredAsync(It.IsAny<CancellationToken>())).ReturnsAsync([]);
        _store.Setup(s => s.GetDeferredAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        _store.Setup(s => s.GetEventTypesAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        _features.Setup(f => f.EnabledAmongAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<string>(),
            It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>())).ReturnsAsync([AccountId]);
        _renderer.Setup(r => r.ResolveLocaleAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(NotificationLocales.English);
        _renderer.Setup(r => r.RenderAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<IReadOnlyDictionary<string, string>>(), It.IsAny<CancellationToken>())).ReturnsAsync(("Subject", "Body"));
    }

    private NotificationDigestJob CreateJob() => new(
        _store.Object, _features.Object, _renderer.Object, UtcAccountTimeZoneResolver.Instance, JobTestHelpers.Configuration(), Mock.Of<ILogger<NotificationDigestJob>>());

    private static DeferredDeliveryVm Deferred(string recipient = "user-a", string channel = NotificationChannels.Email)
        => new(Guid.NewGuid(), AccountId, RuleId, Guid.NewGuid(), channel, RecipientPrincipalTypes.User, recipient);

    private static NotificationRuleVm Rule(string? throttlingJson)
        => new(RuleId, AccountId, "rule", "Alert", true, AlertEventTypes.CommunicationLoss,
            "role:Administrator", "[]", throttlingJson, null, Now, 0);

    private void Deferrals(params DeferredDeliveryVm[] deliveries)
    {
        _store.Setup(s => s.GetAccountsWithDeferredAsync(It.IsAny<CancellationToken>())).ReturnsAsync([AccountId]);
        _store.Setup(s => s.GetDeferredAsync(AccountId, It.IsAny<CancellationToken>())).ReturnsAsync(deliveries);
        _store.Setup(s => s.GetRulesAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([Rule(null)]);
    }

    [Test]
    public async Task OneSummaryPerRuleRecipientAndChannel()
    {
        Deferrals(Deferred(), Deferred(), Deferred("user-b"), Deferred(channel: NotificationChannels.InApp));

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.FoldAsync(AccountId, It.IsAny<DigestGroupKey>(), It.IsAny<string>(),
            It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()), Times.Exactly(3));
    }

    [Test]
    public async Task TheFoldedDeliveriesAreTheGroupMembers()
    {
        var first = Deferred();
        var second = Deferred();
        Deferrals(first, second);

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.FoldAsync(AccountId, It.IsAny<DigestGroupKey>(), It.IsAny<string>(),
            It.Is<IReadOnlyCollection<Guid>>(ids => ids.Count == 2
                && ids.Contains(first.NotificationDeliveryId) && ids.Contains(second.NotificationDeliveryId)),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task NotificationsDisabled_HoldsTheGroup()
    {
        Deferrals(Deferred());
        _features.Setup(f => f.EnabledAmongAsync(It.IsAny<IReadOnlyCollection<Guid>>(), FeatureKeys.Notifications,
            It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.FoldAsync(It.IsAny<Guid>(), It.IsAny<DigestGroupKey>(), It.IsAny<string>(),
            It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task DailyCadence_FoldsAtMostOncePerAccountDay()
    {
        DailyDeferral();
        _store.Setup(s => s.SummaryExistsSinceAsync(It.IsAny<DigestGroupKey>(), new DateTimeOffset(2026, 9, 14, 7, 0, 0, TimeSpan.Zero), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.FoldAsync(It.IsAny<Guid>(), It.IsAny<DigestGroupKey>(), It.IsAny<string>(),
            It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task NoDeferrals_RecordsNoJobRun()
    {
        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.RecordJobRunAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task ARuleThatVanished_IsSkippedWithoutFailingTheCycle()
    {
        Deferrals(Deferred());
        _store.Setup(s => s.GetRulesAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.FoldAsync(It.IsAny<Guid>(), It.IsAny<DigestGroupKey>(), It.IsAny<string>(),
            It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private void DailyDeferral()
    {
        Deferrals(Deferred());
        _store.Setup(s => s.GetRulesAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([Rule($$"""{"digest":"{{DigestCadences.Daily}}"}""")]);
    }

    [Test]
    public async Task DailyCadence_WaitsForTheAccountDigestHour()
    {
        DailyDeferral();

        await CreateJob().RunOnceAsync(new DateTimeOffset(2026, 9, 14, 6, 30, 0, TimeSpan.Zero), CancellationToken.None);

        _store.Verify(s => s.FoldAsync(It.IsAny<Guid>(), It.IsAny<DigestGroupKey>(), It.IsAny<string>(),
            It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public void DailyWindow_OpensAtTheDigestHourOnTheAccountCalendar()
    {
        var bogota = AccountTimeZone.For("America/Bogota");

        Assert.That(NotificationDigestJob.DailyWindowStart(bogota, new DateTimeOffset(2026, 9, 14, 11, 0, 0, TimeSpan.Zero)), Is.Null,
            "06:00 in Bogota is before the digest hour");
        Assert.That(NotificationDigestJob.DailyWindowStart(bogota, new DateTimeOffset(2026, 9, 14, 13, 0, 0, TimeSpan.Zero)),
            Is.EqualTo(new DateTimeOffset(2026, 9, 14, 12, 0, 0, TimeSpan.Zero)));
    }

    [Test]
    public async Task OrphanedDeferrals_AreExpiredEveryCycle()
    {
        _store.Setup(s => s.GetAccountsWithDeferredAsync(It.IsAny<CancellationToken>())).ReturnsAsync([AccountId]);

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.ExpireOrphansAsync(AccountId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public void DailyWindow_OnASpringForwardDay_OpensAtSevenLocal()
    {
        var newYork = AccountTimeZone.For("America/New_York");

        Assert.That(NotificationDigestJob.DailyWindowStart(newYork, new DateTimeOffset(2026, 3, 8, 11, 30, 0, TimeSpan.Zero)),
            Is.EqualTo(new DateTimeOffset(2026, 3, 8, 11, 0, 0, TimeSpan.Zero)));
        Assert.That(NotificationDigestJob.DailyWindowStart(newYork, new DateTimeOffset(2026, 3, 8, 10, 30, 0, TimeSpan.Zero)), Is.Null);
    }

    [Test]
    public async Task OneFailingGroup_DoesNotHoldTheAccountsOtherGroups()
    {
        Deferrals(Deferred("user-a"), Deferred("user-b"));
        _renderer.Setup(r => r.ResolveLocaleAsync(It.IsAny<string>(), "user-a", It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("template broken"));

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.FoldAsync(AccountId, It.Is<DigestGroupKey>(k => k.Recipient == "user-b"), It.IsAny<string>(),
            It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
