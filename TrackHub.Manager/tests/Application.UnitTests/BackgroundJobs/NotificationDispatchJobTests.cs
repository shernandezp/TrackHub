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

namespace Application.UnitTests.BackgroundJobs;

// The backoff ladder, the entitlement hold, the failure classification and the webhook auto-disable
// had no unit-test surface while they lived in the Web layer against a raw DbContext.
[TestFixture]
public class NotificationDispatchJobTests
{
    private static readonly Guid AccountId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 9, 14, 12, 0, 0, TimeSpan.Zero);

    private static DispatchDeliveryVm Delivery(string channel = NotificationChannels.Email, int attempts = 0)
        => new(Guid.NewGuid(), AccountId, Guid.NewGuid(), Guid.NewGuid(), channel, RecipientPrincipalTypes.User, "user-a", attempts, null);




    private static IReadOnlySet<Guid> All => new HashSet<Guid> { AccountId };
    private static IReadOnlySet<Guid> None => new HashSet<Guid>();

    [Test]
    public void Success_IsTerminalAndCountsTheAttempt()
    {
        var outcome = NotificationDispatchJob.Outcome(Delivery(attempts: 2), new NotificationSendResult(true, "provider-id", null), false);

        Assert.Multiple(() =>
        {
            Assert.That(outcome.Status, Is.EqualTo(DeliveryStatuses.Sent));
            Assert.That(outcome.Attempts, Is.EqualTo(3));
            Assert.That(outcome.ProviderMessageId, Is.EqualTo("provider-id"));
            Assert.That(outcome.RaiseFailureAlert, Is.False);
        });
    }

    [Test]
    public void RetryableFailure_ReturnsToPendingWithoutAnAlert()
    {
        var outcome = NotificationDispatchJob.Outcome(Delivery(attempts: 1), new NotificationSendResult(false, null, "timeout"), false);

        Assert.Multiple(() =>
        {
            Assert.That(outcome.Status, Is.EqualTo(DeliveryStatuses.Pending));
            Assert.That(outcome.Attempts, Is.EqualTo(2));
            Assert.That(outcome.Error, Is.EqualTo("timeout"));
            Assert.That(outcome.RaiseFailureAlert, Is.False);
        });
    }

    [Test]
    public void TheLastAttempt_FailsPermanentlyAndRaisesTheAlert()
    {
        var outcome = NotificationDispatchJob.Outcome(
            Delivery(attempts: NotificationDispatchJob.MaxAttempts - 1), new NotificationSendResult(false, null, "gone"), false);

        Assert.Multiple(() =>
        {
            Assert.That(outcome.Status, Is.EqualTo(DeliveryStatuses.Failed));
            Assert.That(outcome.RaiseFailureAlert, Is.True);
        });
    }

    [Test]
    public void NoRegisteredProvider_FailsWithoutBurningTheLadder()
    {
        var outcome = NotificationDispatchJob.Outcome(Delivery(attempts: 0), new NotificationSendResult(false, null, "no provider"), true);

        Assert.Multiple(() =>
        {
            Assert.That(outcome.Status, Is.EqualTo(DeliveryStatuses.Failed));
            Assert.That(outcome.Attempts, Is.EqualTo(NotificationDispatchJob.MaxAttempts));
        });
    }

    [Test]
    public void Entitlements_NotificationsDisabled_HoldsEveryChannel()
    {
        var entitlements = new DispatchEntitlements(None, All, All);

        Assert.That(entitlements.Allows(AccountId, NotificationChannels.InApp), Is.False);
    }

    [Test]
    public void Entitlements_BillableChannelsNeedTheirOwnKey()
    {
        var entitlements = new DispatchEntitlements(All, None, All);

        Assert.Multiple(() =>
        {
            Assert.That(entitlements.Allows(AccountId, NotificationChannels.Email), Is.False);
            Assert.That(entitlements.Allows(AccountId, NotificationChannels.WhatsApp), Is.True);
            Assert.That(entitlements.Allows(AccountId, NotificationChannels.InApp), Is.True);
            Assert.That(entitlements.Allows(AccountId, NotificationChannels.Webhook), Is.True);
        });
    }

    [Test]
    public async Task TheBackoffLadderIsPassedAsOneCutoffPerAttempt()
    {
        var store = new Mock<INotificationDispatchStore>();
        store.Setup(s => s.GetStrandedSendingAsync(It.IsAny<DateTimeOffset>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        store.Setup(s => s.GetEligiblePendingAsync(It.IsAny<IReadOnlyList<DateTimeOffset>>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        await CreateJob(store).RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.GetEligiblePendingAsync(
            It.Is<IReadOnlyList<DateTimeOffset>>(c => c.Count == 4
                && c[0] == Now.AddMinutes(-1) && c[1] == Now.AddMinutes(-5)
                && c[2] == Now.AddMinutes(-15) && c[3] == Now.AddMinutes(-60)),
            NotificationDispatchJob.BatchSize, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task StrandedSendingRowsAreReclaimedThroughTheFailurePath()
    {
        var stranded = Delivery(attempts: 1);
        var store = new Mock<INotificationDispatchStore>();
        store.Setup(s => s.GetStrandedSendingAsync(It.IsAny<DateTimeOffset>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([stranded]);
        store.Setup(s => s.GetEligiblePendingAsync(It.IsAny<IReadOnlyList<DateTimeOffset>>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        await CreateJob(store).RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.GetStrandedSendingAsync(
            Now.AddMinutes(-NotificationDispatchJob.DefaultSendingReclaimMinutes), NotificationDispatchJob.BatchSize, It.IsAny<CancellationToken>()), Times.Once);
        store.Verify(s => s.ApplyOutcomeAsync(
            It.Is<DeliveryOutcome>(o => o.NotificationDeliveryId == stranded.NotificationDeliveryId
                && o.Status == DeliveryStatuses.Pending && o.Attempts == 2),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task HeldDeliveriesAreNeverMarkedSending()
    {
        var store = new Mock<INotificationDispatchStore>();
        store.Setup(s => s.GetStrandedSendingAsync(It.IsAny<DateTimeOffset>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        store.Setup(s => s.GetEligiblePendingAsync(It.IsAny<IReadOnlyList<DateTimeOffset>>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([Delivery()]);
        var features = new Mock<IAccountFeatureGate>();
        features.Setup(f => f.EnabledAmongAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<string>(),
            It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);

        await CreateJob(store, features).RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.MarkSendingAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        store.Verify(s => s.RecordJobRunAsync(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    // One row whose outcome cannot be written must not abandon the rest of the batch: it stays in
    // Sending and the next cycle's reclaim puts it back on the ladder.
    [Test]
    public async Task ADeliveryWhoseOutcomeCannotBeRecorded_DoesNotAbandonTheBatch()
    {
        var poison = Delivery();
        var healthy = Delivery();
        var store = new Mock<INotificationDispatchStore>();
        store.Setup(s => s.GetStrandedSendingAsync(It.IsAny<DateTimeOffset>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        store.Setup(s => s.GetEligiblePendingAsync(It.IsAny<IReadOnlyList<DateTimeOffset>>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([poison, healthy]);
        store.Setup(s => s.ApplyOutcomeAsync(
                It.Is<DeliveryOutcome>(o => o.NotificationDeliveryId == poison.NotificationDeliveryId),
                It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("row is locked"));

        await CreateJob(store).RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.ApplyOutcomeAsync(
            It.Is<DeliveryOutcome>(o => o.NotificationDeliveryId == healthy.NotificationDeliveryId),
            It.IsAny<CancellationToken>()), Times.Once);

        // Only the delivery that was actually recorded counts towards the cycle.
        store.Verify(s => s.RecordJobRunAsync("1", It.IsAny<string>(), Now, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task AProviderThatThrows_StillRecordsTheDeliveryAsFailedAndContinues()
    {
        var delivery = Delivery(attempts: NotificationDispatchJob.MaxAttempts - 1);
        var store = new Mock<INotificationDispatchStore>();
        store.Setup(s => s.GetStrandedSendingAsync(It.IsAny<DateTimeOffset>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        store.Setup(s => s.GetEligiblePendingAsync(It.IsAny<IReadOnlyList<DateTimeOffset>>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([delivery]);
        store.Setup(s => s.MarkSendingAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new TimeoutException("db timeout"));

        await CreateJob(store).RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.ApplyOutcomeAsync(
            It.Is<DeliveryOutcome>(o => o.Status == DeliveryStatuses.Failed && o.Error == "db timeout" && o.RaiseFailureAlert),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    private static NotificationDispatchJob CreateJob(
        Mock<INotificationDispatchStore> store, Mock<IAccountFeatureGate>? features = null)
    {
        if (features is null)
        {
            features = new Mock<IAccountFeatureGate>();
            features.Setup(f => f.EnabledAmongAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<string>(),
                It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>())).ReturnsAsync([AccountId]);
        }

        return new NotificationDispatchJob(
            store.Object, features.Object, Mock.Of<INotificationRenderer>(), [], Mock.Of<IPublisher>(),
            JobTestHelpers.Configuration(), Mock.Of<ILogger<NotificationDispatchJob>>());
    }
}
