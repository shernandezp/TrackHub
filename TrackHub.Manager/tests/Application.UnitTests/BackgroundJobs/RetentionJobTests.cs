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
using TrackHub.Manager.Domain.Interfaces;
using Common.Domain.Constants;

namespace Application.UnitTests.BackgroundJobs;

// The retention windows and the durable-marker exclusions had no unit-test surface while they lived
// in the Web layer against a raw DbContext.
[TestFixture]
public class RetentionJobTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 14, 12, 0, 0, TimeSpan.Zero);

    [Test]
    public async Task DeliveryRetention_UsesTheConfiguredWindow()
    {
        var store = new Mock<IDeliveryRetentionStore>();
        var job = new DeliveryRetentionJob(
            store.Object,
            JobTestHelpers.Configuration(("AppSettings:NotificationDeliveryRetentionDays", "30")),
            Mock.Of<ILogger<DeliveryRetentionJob>>());

        await job.RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.DeleteCompletedDeliveriesAsync(Now.AddDays(-30), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task DeliveryRetention_UnconfiguredWindow_FallsBackToTheDefault()
    {
        var store = new Mock<IDeliveryRetentionStore>();
        var job = new DeliveryRetentionJob(store.Object, JobTestHelpers.Configuration(), Mock.Of<ILogger<DeliveryRetentionJob>>());

        await job.RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.DeleteCompletedDeliveriesAsync(
            Now.AddDays(-DeliveryRetentionJob.DefaultRetentionDays), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task DeliveryRetention_NothingDeleted_RecordsNoJobRun()
    {
        var store = new Mock<IDeliveryRetentionStore>();
        var job = new DeliveryRetentionJob(store.Object, JobTestHelpers.Configuration(), Mock.Of<ILogger<DeliveryRetentionJob>>());

        await job.RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.RecordJobRunAsync(
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task DeliveryRetention_SomethingDeleted_RecordsTheRun()
    {
        var store = new Mock<IDeliveryRetentionStore>();
        store.Setup(s => s.DeleteCompletedDeliveriesAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>())).ReturnsAsync(7);
        var job = new DeliveryRetentionJob(store.Object, JobTestHelpers.Configuration(), Mock.Of<ILogger<DeliveryRetentionJob>>());

        await job.RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.RecordJobRunAsync("7", $"retention:{Now:yyyyMMdd}", Now, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task PlatformRetention_ExcludesTheDurableIdempotencyMarkers()
    {
        var store = new Mock<IPlatformRetentionStore>();
        var job = new PlatformRetentionJob(store.Object, JobTestHelpers.Configuration(), Mock.Of<ILogger<PlatformRetentionJob>>());

        await job.RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.DeleteAgedJobRunsAsync(
            Now.AddDays(-PlatformRetentionJob.DefaultJobRunRetentionDays),
            It.Is<IReadOnlyCollection<string>>(keys =>
                keys.Contains(BackgroundJobKeys.WorkforceExpirationScan) && keys.Contains(BackgroundJobKeys.DocumentExpiration)),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task PlatformRetention_AlertEventsUseTheirOwnLongerWindow()
    {
        var store = new Mock<IPlatformRetentionStore>();
        var job = new PlatformRetentionJob(store.Object, JobTestHelpers.Configuration(), Mock.Of<ILogger<PlatformRetentionJob>>());

        await job.RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.DeleteAgedResolvedAlertEventsAsync(
            Now.AddDays(-PlatformRetentionJob.DefaultAlertEventRetentionDays), It.IsAny<CancellationToken>()), Times.Once);
    }
}
