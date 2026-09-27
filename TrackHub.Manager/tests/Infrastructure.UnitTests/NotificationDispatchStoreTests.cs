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

using Common.Application.Interfaces;
using Common.Domain.Constants;
using Moq;
using TrackHub.Manager.Domain.Constants;
using TrackHub.Manager.Domain.Records;
using TrackHub.Manager.Infrastructure;
using TrackHub.Manager.Infrastructure.Interfaces;
using TrackHub.Manager.Infrastructure.ManagerDB.Jobs;
using TrackHub.Manager.Infrastructure.ManagerDB.Writers;

namespace Infrastructure.UnitTests;

[TestFixture]
public class NotificationDispatchStoreTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 26, 12, 0, 0, TimeSpan.Zero);
    private static readonly IReadOnlyList<DateTimeOffset> Cutoffs = [Now.AddMinutes(-1), Now.AddMinutes(-5), Now.AddMinutes(-15), Now.AddMinutes(-60)];

    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    private static async Task EnableAsync(ApplicationDbContext context, Guid accountId, params string[] featureKeys)
    {
        foreach (var key in featureKeys)
        {
            await context.AccountFeatures.AddAsync(new AccountFeature(accountId, key, true, "standard", "manual", null, null, null));
        }
        await context.SaveChangesAsync(CancellationToken.None);
    }

    private static async Task<NotificationDelivery> PendingAsync(ApplicationDbContext context, Guid accountId, string channel)
    {
        var delivery = new NotificationDelivery(accountId, null, null, channel, RecipientPrincipalTypes.User, Guid.NewGuid().ToString(), DeliveryStatuses.Pending);
        await context.NotificationDeliveries.AddAsync(delivery);
        await context.SaveChangesAsync(CancellationToken.None);
        return delivery;
    }

    // A backlog of held rows (channel or notifications switched off) must never occupy the batch
    // slots another account's live deliveries need.
    [Test]
    public async Task HeldDeliveries_AreNotSelected_SoTheyCannotStarveTheBatch()
    {
        await using var context = NewContext(nameof(HeldDeliveries_AreNotSelected_SoTheyCannotStarveTheBatch));
        var switchedOff = Guid.NewGuid();
        var emailOff = Guid.NewGuid();
        var live = Guid.NewGuid();
        await EnableAsync(context, emailOff, FeatureKeys.Notifications);
        await EnableAsync(context, live, FeatureKeys.Notifications, FeatureKeys.NotificationsEmail);
        for (var i = 0; i < 5; i++)
        {
            await PendingAsync(context, switchedOff, NotificationChannels.InApp);
            await PendingAsync(context, emailOff, NotificationChannels.Email);
        }
        var heldAccountInApp = await PendingAsync(context, emailOff, NotificationChannels.InApp);
        var liveEmail = await PendingAsync(context, live, NotificationChannels.Email);

        var eligible = await new NotificationDispatchStore(context as IApplicationDbContext).GetEligiblePendingAsync(Cutoffs, Now, 3, CancellationToken.None);

        Assert.That(eligible.Select(d => d.NotificationDeliveryId), Is.EquivalentTo(new[] { heldAccountInApp.NotificationDeliveryId, liveEmail.NotificationDeliveryId }));
    }

    [Test]
    public async Task EachBillableChannel_NeedsItsOwnKey()
    {
        await using var context = NewContext(nameof(EachBillableChannel_NeedsItsOwnKey));
        var accountId = Guid.NewGuid();
        await EnableAsync(context, accountId, FeatureKeys.Notifications, FeatureKeys.NotificationsWhatsApp);
        var whatsApp = await PendingAsync(context, accountId, NotificationChannels.WhatsApp);
        await PendingAsync(context, accountId, NotificationChannels.Email);
        await PendingAsync(context, accountId, NotificationChannels.Push);
        var webhook = await PendingAsync(context, accountId, NotificationChannels.Webhook);

        var eligible = await new NotificationDispatchStore(context as IApplicationDbContext).GetEligiblePendingAsync(Cutoffs, Now, 100, CancellationToken.None);

        Assert.That(eligible.Select(d => d.NotificationDeliveryId), Is.EquivalentTo(new[] { whatsApp.NotificationDeliveryId, webhook.NotificationDeliveryId }));
    }
}
