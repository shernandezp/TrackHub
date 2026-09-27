using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TrackHub.Manager.Domain.Constants;
using TrackHub.Manager.Domain.Interfaces;
using TrackHub.Manager.Domain.Models;
using TrackHub.Manager.Domain.Records;
using TrackHub.Manager.Infrastructure;
using TrackHub.Manager.Infrastructure.Interfaces;
using TrackHub.Manager.Infrastructure.ManagerDB.Services;

namespace TrackHub.Manager.Infrastructure.UnitTests;

public class AlertRecorderTests
{
    private static readonly Guid AccountId = Guid.NewGuid();

    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    private static AlertEventDto Dto(string key, string status = "Open", string eventType = AlertEventTypes.CommunicationLoss, string resourceId = "r1")
        => new(AccountId, eventType, AlertSeverities.Warning, "Notifications", "Transporter", resourceId, status, null, key);

    private static (AlertRecorder Recorder, Mock<IAlertRuleEvaluator> Evaluator) Recorder(ApplicationDbContext context)
    {
        var evaluator = new Mock<IAlertRuleEvaluator>();
        return (new AlertRecorder(context as IApplicationDbContext, evaluator.Object, NullLogger<AlertRecorder>.Instance), evaluator);
    }

    [Test]
    public async Task FirstEmission_OpensTheAlert_AndRunsTheRules()
    {
        await using var context = NewContext(nameof(FirstEmission_OpensTheAlert_AndRunsTheRules));
        var (recorder, evaluator) = Recorder(context);

        var result = await recorder.RecordAsync(Dto("k1"), CancellationToken.None);

        Assert.That(result.Transition, Is.EqualTo(AlertTransition.Opened));
        evaluator.Verify(e => e.EvaluateAsync(It.Is<AlertEventVm>(a => a.AlertEventId == result.Event.AlertEventId), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task RepeatWhileOpen_FoldsIntoTheSameRow()
    {
        await using var context = NewContext(nameof(RepeatWhileOpen_FoldsIntoTheSameRow));
        var (recorder, _) = Recorder(context);
        var first = await recorder.RecordAsync(Dto("k1"), CancellationToken.None);

        var repeat = await recorder.RecordAsync(Dto("k1"), CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(repeat.Transition, Is.EqualTo(AlertTransition.Repeated));
            Assert.That(repeat.Event.AlertEventId, Is.EqualTo(first.Event.AlertEventId));
            Assert.That(context.AlertEvents.Count(), Is.EqualTo(1));
        });
    }

    [Test]
    public async Task ResolvedEmission_ClosesTheOpenRow_WithoutRunningTheRules()
    {
        await using var context = NewContext(nameof(ResolvedEmission_ClosesTheOpenRow_WithoutRunningTheRules));
        var (recorder, evaluator) = Recorder(context);
        await recorder.RecordAsync(Dto("k1"), CancellationToken.None);
        evaluator.Invocations.Clear();

        var recovered = await recorder.RecordAsync(Dto("k1", "Resolved"), CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(recovered.Transition, Is.EqualTo(AlertTransition.Recovered));
            Assert.That(context.AlertEvents.Single().Status, Is.EqualTo("Resolved"));
        });
        evaluator.Verify(e => e.EvaluateAsync(It.IsAny<AlertEventVm>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task ResolvedEmission_ForAClosedKey_RecordsNothing()
    {
        await using var context = NewContext(nameof(ResolvedEmission_ForAClosedKey_RecordsNothing));
        var (recorder, evaluator) = Recorder(context);
        await recorder.RecordAsync(Dto("k1"), CancellationToken.None);
        await recorder.RecordAsync(Dto("k1", "Resolved"), CancellationToken.None);
        evaluator.Invocations.Clear();

        var again = await recorder.RecordAsync(Dto("k1", "Resolved"), CancellationToken.None);

        Assert.That(again.Transition, Is.EqualTo(AlertTransition.Ignored));
        Assert.That(context.AlertEvents.Count(), Is.EqualTo(1));
        evaluator.Verify(e => e.EvaluateAsync(It.IsAny<AlertEventVm>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task InformationalEvent_EmittedResolvedOnANewKey_OpensAndNotifies()
    {
        await using var context = NewContext(nameof(InformationalEvent_EmittedResolvedOnANewKey_OpensAndNotifies));
        var (recorder, evaluator) = Recorder(context);

        var result = await recorder.RecordAsync(Dto("msg-1", "Resolved", AlertEventTypes.TripAssigned), CancellationToken.None);

        Assert.That(result.Transition, Is.EqualTo(AlertTransition.Opened));
        evaluator.Verify(e => e.EvaluateAsync(It.IsAny<AlertEventVm>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task AfterResolution_ANewEmissionOpensANewRow()
    {
        await using var context = NewContext(nameof(AfterResolution_ANewEmissionOpensANewRow));
        var (recorder, _) = Recorder(context);
        await recorder.RecordAsync(Dto("k1"), CancellationToken.None);
        await recorder.RecordAsync(Dto("k1", "Resolved"), CancellationToken.None);

        var reopened = await recorder.RecordAsync(Dto("k1"), CancellationToken.None);

        Assert.That(reopened.Transition, Is.EqualTo(AlertTransition.Opened));
        Assert.That(context.AlertEvents.Count(), Is.EqualTo(2));
    }

    [Test]
    public async Task ResolveOpen_ClosesOnlyTheNamedTypesOnThatResource()
    {
        await using var context = NewContext(nameof(ResolveOpen_ClosesOnlyTheNamedTypesOnThatResource));
        var (recorder, _) = Recorder(context);
        await recorder.RecordAsync(Dto("a", eventType: AlertEventTypes.CommunicationLoss, resourceId: "t1"), CancellationToken.None);
        await recorder.RecordAsync(Dto("b", eventType: AlertEventTypes.GpsDeviceRemoved, resourceId: "t1"), CancellationToken.None);
        await recorder.RecordAsync(Dto("c", eventType: AlertEventTypes.CommunicationLoss, resourceId: "t2"), CancellationToken.None);

        var resolved = await recorder.ResolveOpenAsync(AccountId, "Transporter", "t1", [AlertEventTypes.CommunicationLoss], CancellationToken.None);

        Assert.That(resolved, Is.EqualTo(1));
        Assert.That(context.AlertEvents.Where(a => a.Status == "Resolved").Select(a => a.DeduplicationKey), Is.EquivalentTo(new[] { "a" }));
    }
}
