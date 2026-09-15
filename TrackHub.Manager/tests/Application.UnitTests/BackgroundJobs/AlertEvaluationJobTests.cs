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

// The comm-loss threshold, the escalation policy and the daily credential scan had no unit-test
// surface while they lived in the Web layer against a raw DbContext.
[TestFixture]
public class AlertEvaluationJobTests
{
    private static readonly Guid AccountId = Guid.NewGuid();
    private static readonly DateTimeOffset Now = new(2026, 9, 14, 12, 0, 0, TimeSpan.Zero);

    private Mock<IAlertEvaluationStore> _store = null!;
    private Mock<IAlertRuleEvaluator> _evaluator = null!;

    [SetUp]
    public void SetUp()
    {
        _store = new Mock<IAlertEvaluationStore>();
        _evaluator = new Mock<IAlertRuleEvaluator>();

        _store.Setup(s => s.GetFeatureEnabledActiveAccountsAsync(It.IsAny<string>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _store.Setup(s => s.GetEnabledRulesAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<IReadOnlyCollection<string>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _store.Setup(s => s.GetStaleTransportersAsync(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _store.Setup(s => s.GetOpenCriticalAlertsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _store.Setup(s => s.GetExpiringCredentialsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        _store.Setup(s => s.JobRunSucceededAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
    }

    private AlertEvaluationJob CreateJob() => new(
        _store.Object, _evaluator.Object, Mock.Of<ILogger<AlertEvaluationJob>>());

    private static NotificationRuleVm Rule(string triggerEvent, string? configurationJson)
        => new(Guid.NewGuid(), AccountId, "rule", "Alert", true, triggerEvent, "role:Administrator", "[]", null, configurationJson, Now);

    private void NotificationsEnabledFor(params Guid[] accountIds)
        => _store.Setup(s => s.GetFeatureEnabledActiveAccountsAsync(FeatureKeys.Notifications, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(accountIds);

    [Test]
    public async Task CommunicationLoss_UsesTheRuleThreshold_NotTheDefault()
    {
        NotificationsEnabledFor(AccountId);
        _store.Setup(s => s.GetEnabledRulesAsync(It.IsAny<IReadOnlyCollection<Guid>>(),
                It.Is<IReadOnlyCollection<string>>(e => e.Contains(AlertEventTypes.CommunicationLoss)), It.IsAny<CancellationToken>()))
            .ReturnsAsync([Rule(AlertEventTypes.CommunicationLoss, "{\"thresholdMinutes\":15}")]);

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.GetStaleTransportersAsync(AccountId, Now.AddMinutes(-15), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task CommunicationLoss_NoConfiguredThreshold_FallsBackToSixtyMinutes()
    {
        NotificationsEnabledFor(AccountId);
        _store.Setup(s => s.GetEnabledRulesAsync(It.IsAny<IReadOnlyCollection<Guid>>(),
                It.Is<IReadOnlyCollection<string>>(e => e.Contains(AlertEventTypes.CommunicationLoss)), It.IsAny<CancellationToken>()))
            .ReturnsAsync([Rule(AlertEventTypes.CommunicationLoss, null)]);

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.GetStaleTransportersAsync(
            AccountId, Now.AddMinutes(-AlertEvaluationJob.DefaultCommunicationLossThresholdMinutes), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task CommunicationLoss_DedupedAwayAlert_IsNotEvaluatedAndRecordsNoRun()
    {
        NotificationsEnabledFor(AccountId);
        _store.Setup(s => s.GetEnabledRulesAsync(It.IsAny<IReadOnlyCollection<Guid>>(),
                It.Is<IReadOnlyCollection<string>>(e => e.Contains(AlertEventTypes.CommunicationLoss)), It.IsAny<CancellationToken>()))
            .ReturnsAsync([Rule(AlertEventTypes.CommunicationLoss, null)]);
        _store.Setup(s => s.GetStaleTransportersAsync(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new StaleTransporterVm(Guid.NewGuid(), "Truck 1", Now.AddHours(-3))]);
        _store.Setup(s => s.RecordDedupedAlertAsync(It.IsAny<AlertEventDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AlertEventVm?)null);

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _evaluator.Verify(e => e.EvaluateAsync(It.IsAny<AlertEventVm>(), It.IsAny<CancellationToken>()), Times.Never);
        _store.Verify(s => s.RecordJobRunAsync(AlertEvaluationJob.JobKey, null, It.IsAny<string>(),
            It.Is<string>(k => k.StartsWith("comm-loss:")), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private void OneOpenCritical(DateTimeOffset firstSeenAt, string? configurationJson)
    {
        var alertEventId = Guid.NewGuid();
        NotificationsEnabledFor(AccountId);
        _store.Setup(s => s.GetOpenCriticalAlertsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new AlertEventVm(alertEventId, AccountId, AlertEventTypes.CommunicationLoss,
                AlertSeverities.Critical, "Notifications", "Transporter", "t", "Open", firstSeenAt, firstSeenAt, null, "dedup", firstSeenAt)]);
        _store.Setup(s => s.GetEnabledRulesAsync(It.IsAny<IReadOnlyCollection<Guid>>(),
                It.Is<IReadOnlyCollection<string>>(e => e.Contains(AlertEventTypes.CommunicationLoss)), It.IsAny<CancellationToken>()))
            .ReturnsAsync([Rule(AlertEventTypes.CommunicationLoss, configurationJson)]);
        _store.Setup(s => s.JobRunSucceededAsync(It.IsAny<string>(), It.Is<string>(k => k.StartsWith("escalate:")), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
    }

    [Test]
    public async Task Escalation_PastTheWindow_EscalatesOnce()
    {
        OneOpenCritical(Now.AddMinutes(-31), "{\"escalateAfterMinutes\":30}");

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.EscalateToAdministratorsAsync(AccountId, It.IsAny<Guid>(), It.IsAny<Guid>(),
            AlertEvaluationJob.JobKey, It.Is<string>(k => k.StartsWith("escalate:")), Now, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task Escalation_InsideTheWindow_DoesNothing()
    {
        OneOpenCritical(Now.AddMinutes(-29), "{\"escalateAfterMinutes\":30}");

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.EscalateToAdministratorsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Escalation_RuleWithoutEscalateAfterMinutes_DoesNothing()
    {
        OneOpenCritical(Now.AddDays(-7), null);

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.EscalateToAdministratorsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Escalation_AlreadyEscalated_IsNotRepeated()
    {
        OneOpenCritical(Now.AddMinutes(-31), "{\"escalateAfterMinutes\":30}");
        _store.Setup(s => s.JobRunSucceededAsync(It.IsAny<string>(), It.Is<string>(k => k.StartsWith("escalate:")), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.EscalateToAdministratorsAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<Guid>(),
            It.IsAny<string>(), It.IsAny<string>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task CredentialScan_AlreadyRanToday_IsSkipped()
    {
        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.GetFeatureEnabledActiveAccountsAsync(
            FeatureKeys.GpsIntegration, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task CredentialScan_RecordsItsDailyRunEvenWhenNothingExpires()
    {
        _store.Setup(s => s.JobRunSucceededAsync(It.IsAny<string>(), It.Is<string>(k => k.StartsWith("credential-scan:")), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        // The daily run row is the idempotency marker; without it the scan would repeat every cycle.
        _store.Verify(s => s.RecordJobRunAsync(AlertEvaluationJob.JobKey, null, "0",
            $"credential-scan:{Now:yyyyMMdd}", Now, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task CredentialScan_ExpiringCredential_IsAlertedAndEvaluated()
    {
        _store.Setup(s => s.JobRunSucceededAsync(It.IsAny<string>(), It.Is<string>(k => k.StartsWith("credential-scan:")), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _store.Setup(s => s.GetFeatureEnabledActiveAccountsAsync(FeatureKeys.GpsIntegration, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([AccountId]);
        var operatorId = Guid.NewGuid();
        _store.Setup(s => s.GetExpiringCredentialsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new ExpiringCredentialVm(Guid.NewGuid(), operatorId, AccountId, Now.AddDays(2), null, Now.AddDays(2))]);
        _store.Setup(s => s.RecordDedupedAlertAsync(It.IsAny<AlertEventDto>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AlertEventVm(Guid.NewGuid(), AccountId, AlertEventTypes.GpsCredentialExpiring,
                AlertSeverities.Warning, "GpsIntegration", "Operator", operatorId.ToString(), "Open", Now, Now, null, "k", Now));

        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.GetExpiringCredentialsAsync(
            It.IsAny<IReadOnlyCollection<Guid>>(),
            Now.AddDays(AlertEvaluationJob.CredentialExpiryWithinDays),
            It.IsAny<CancellationToken>()), Times.Once);
        _evaluator.Verify(e => e.EvaluateAsync(It.IsAny<AlertEventVm>(), It.IsAny<CancellationToken>()), Times.Once);
        _store.Verify(s => s.RecordJobRunAsync(AlertEvaluationJob.JobKey, null, "1",
            $"credential-scan:{Now:yyyyMMdd}", Now, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task NoNotificationsEnabledAccounts_SkipsCommunicationLossAndEscalation()
    {
        await CreateJob().RunOnceAsync(Now, CancellationToken.None);

        _store.Verify(s => s.GetOpenCriticalAlertsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
