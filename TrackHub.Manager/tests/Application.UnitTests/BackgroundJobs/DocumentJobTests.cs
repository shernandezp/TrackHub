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

// The scan classification, the expiration bands and the legal-hold hook had no unit-test surface
// while they lived in the Web layer against a raw DbContext.
[TestFixture]
public class DocumentJobTests
{
    private static readonly Guid AccountId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 9, 14, 12, 0, 0, TimeSpan.Zero);

    private static QuarantinedDocumentVm Quarantined(string status = DocumentStatuses.Uploaded)
        => new(Guid.NewGuid(), AccountId, 3, "key", "Insurance", status);

    [Test]
    public void Scan_Clean_ActivatesAnUploadedDocument()
    {
        var outcome = DocumentScanJob.Classify(Quarantined(), DocumentScanStatuses.Clean);

        Assert.Multiple(() =>
        {
            Assert.That(outcome.Activate, Is.True);
            Assert.That(outcome.RaiseInfectedAlert, Is.False);
            Assert.That(outcome.ScanStatus, Is.EqualTo(DocumentScanStatuses.Clean));
        });
    }

    [Test]
    public void Scan_Clean_LeavesAnAlreadyActiveDocumentAlone()
        => Assert.That(DocumentScanJob.Classify(Quarantined(DocumentStatuses.Active), DocumentScanStatuses.Clean).Activate, Is.False);

    [Test]
    public void Scan_Infected_RaisesTheAlertAndNeverActivates()
    {
        var outcome = DocumentScanJob.Classify(Quarantined(), DocumentScanStatuses.Infected);

        Assert.Multiple(() =>
        {
            Assert.That(outcome.RaiseInfectedAlert, Is.True);
            Assert.That(outcome.Activate, Is.False);
        });
    }

    [Test]
    public async Task Scan_AlreadyRecordedForThisVersion_DoesNotRescan()
    {
        var store = new Mock<IDocumentScanStore>();
        store.Setup(s => s.GetQuarantinedAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([Quarantined()]);
        store.Setup(s => s.JobRunSucceededAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var scanner = new Mock<IDocumentScanner>();

        await new DocumentScanJob(store.Object, scanner.Object, Mock.Of<ILogger<DocumentScanJob>>())
            .RunOnceAsync(Now, CancellationToken.None);

        scanner.Verify(s => s.ScanAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Scan_OneFailure_DoesNotAbandonTheBatch()
    {
        var failing = Quarantined();
        var store = new Mock<IDocumentScanStore>();
        store.Setup(s => s.GetQuarantinedAsync(It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([failing, Quarantined()]);
        store.Setup(s => s.JobRunSucceededAsync(It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
        var scanner = new Mock<IDocumentScanner>();
        scanner.SetupSequence(s => s.ScanAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("scanner down"))
            .ReturnsAsync(DocumentScanStatuses.Clean);

        await new DocumentScanJob(store.Object, scanner.Object, Mock.Of<ILogger<DocumentScanJob>>())
            .RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.RecordFailureAsync(failing.DocumentId, AccountId, It.IsAny<string>(), It.IsAny<DateTimeOffset>(),
            nameof(InvalidOperationException), "scanner down", It.IsAny<CancellationToken>()), Times.Once);
        store.Verify(s => s.ApplyScanResultAsync(It.IsAny<QuarantinedDocumentVm>(), It.IsAny<DocumentScanOutcome>(),
            It.IsAny<string>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public void Expiration_PastDue_IsTheExpiredBand()
        => Assert.That(DocumentExpirationJob.ThresholdFor(Now.AddHours(-1), Now), Is.EqualTo(DocumentExpirationJob.ExpiredThreshold));

    [Test]
    public void Expiration_RaisesOnlyTheNearestCrossedBand()
        => Assert.That(DocumentExpirationJob.ThresholdFor(Now.AddDays(5), Now), Is.EqualTo("7"));

    [Test]
    public void Expiration_OutsideEveryBand_RaisesNothing()
        => Assert.That(DocumentExpirationJob.ThresholdFor(Now.AddDays(45), Now), Is.Null);

    [Test]
    public async Task Expiration_NoFeatureEnabledAccounts_NeverQueriesDocuments()
    {
        var features = new Mock<IAccountFeatureGate>();
        features.Setup(f => f.EnabledAccountsAsync(It.IsAny<string>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        var store = new Mock<IDocumentExpirationStore>();

        await new DocumentExpirationJob(features.Object, store.Object, Mock.Of<IAlertRuleEvaluator>(), Mock.Of<ILogger<DocumentExpirationJob>>())
            .RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.GetExpiringAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Expiration_MarksTheDocumentExpiredOnlyForTheExpiredBand()
    {
        var document = new ExpiringDocumentVm(Guid.NewGuid(), AccountId, "Insurance", Now.AddHours(-1));
        var features = new Mock<IAccountFeatureGate>();
        features.Setup(f => f.EnabledAccountsAsync(FeatureKeys.Documents, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([AccountId]);
        var store = new Mock<IDocumentExpirationStore>();
        store.Setup(s => s.GetExpiringAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([document]);
        store.Setup(s => s.RecordDedupedAlertAsync(It.IsAny<AlertEventDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AlertEventVm(Guid.NewGuid(), AccountId, AlertEventTypes.DocumentExpired, AlertSeverities.High,
                "Documents", "Document", document.DocumentId.ToString(), "Open", Now, Now, null, "dedup", Now));

        await new DocumentExpirationJob(features.Object, store.Object, Mock.Of<IAlertRuleEvaluator>(), Mock.Of<ILogger<DocumentExpirationJob>>())
            .RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.CompleteAsync(document.DocumentId, AccountId, true, $"{document.DocumentId:N}:expired",
            Now, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task RetentionCleanup_LegalHold_KeepsTheBytes()
    {
        var version = new PurgeableVersionVm(Guid.NewGuid(), Guid.NewGuid(), AccountId, 1, "key");
        var store = new Mock<IDocumentRetentionStore>();
        store.Setup(s => s.GetPurgeableVersionsAsync(It.IsAny<DateTimeOffset>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([version]);
        store.Setup(s => s.HasLegalHoldAsync(version.DocumentId, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var storage = new Mock<IDocumentStorage>();

        await new DocumentRetentionCleanupJob(store.Object, storage.Object, JobTestHelpers.Configuration(), Mock.Of<ILogger<DocumentRetentionCleanupJob>>())
            .RunOnceAsync(Now, CancellationToken.None);

        storage.Verify(s => s.DeleteAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        store.Verify(s => s.RecordPurgeAsync(It.IsAny<PurgeableVersionVm>(), It.IsAny<string>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task RetentionCleanup_UsesTheConfiguredWindow()
    {
        var store = new Mock<IDocumentRetentionStore>();
        store.Setup(s => s.GetPurgeableVersionsAsync(It.IsAny<DateTimeOffset>(), It.IsAny<int>(), It.IsAny<CancellationToken>())).ReturnsAsync([]);
        var configuration = JobTestHelpers.Configuration(("DocumentStorage:RetentionDays", "365"));

        await new DocumentRetentionCleanupJob(store.Object, Mock.Of<IDocumentStorage>(), configuration, Mock.Of<ILogger<DocumentRetentionCleanupJob>>())
            .RunOnceAsync(Now, CancellationToken.None);

        store.Verify(s => s.GetPurgeableVersionsAsync(Now.AddDays(-365), DocumentRetentionCleanupJob.BatchSize, It.IsAny<CancellationToken>()), Times.Once);
    }
}
