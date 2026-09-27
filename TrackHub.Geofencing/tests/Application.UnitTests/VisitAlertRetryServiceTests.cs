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
using TrackHub.Geofencing.Application.GeofenceEvents.Services;
using TrackHub.Geofencing.Domain.Interfaces;
using TrackHub.Geofencing.Domain.Records;
namespace TrackHub.Geofencing.Application.UnitTests.GeofenceEvents.Services;

[TestFixture]
public class VisitAlertRetryServiceTests
{
    private Mock<IGeofenceEventReader> _reader = null!;
    private Mock<IGeofenceEventWriter> _writer = null!;
    private Mock<IAlertEmitter> _emitter = null!;

    [SetUp]
    public void SetUp()
    {
        _reader = new Mock<IGeofenceEventReader>();
        _writer = new Mock<IGeofenceEventWriter>();
        _emitter = new Mock<IAlertEmitter>();
    }

    private VisitAlertRetryService CreateService()
        => new(_reader.Object, _writer.Object, _emitter.Object, Mock.Of<ILogger<VisitAlertRetryService>>());

    private static PendingVisitAlertVm Pending(bool entryPending, bool exitPending, DateTimeOffset? departure = null, bool alertOnEntry = true, bool alertOnExit = true)
        => new(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "Zone", 1,
            new DateTimeOffset(2026, 9, 27, 10, 0, 0, TimeSpan.Zero), departure, 10.0, 20.0, entryPending, alertOnEntry, exitPending, alertOnExit);

    [Test]
    public async Task RetryPendingAlertsAsync_EntryPending_EmitsAndStampsTheEntry()
    {
        var visit = Pending(entryPending: true, exitPending: false);
        _reader.Setup(r => r.GetPendingVisitAlertsAsync(It.IsAny<CancellationToken>())).ReturnsAsync([visit]);

        var emitted = await CreateService().RetryPendingAlertsAsync(CancellationToken.None);

        Assert.That(emitted, Is.EqualTo(1));
        _emitter.Verify(e => e.EmitGeofenceEnteredAsync(It.Is<GeofenceAlertDto>(a => a.GeofenceEventId == visit.GeofenceEventId), It.IsAny<CancellationToken>()), Times.Once);
        _writer.Verify(w => w.StampEntryAlertedAsync(visit.GeofenceEventId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Once);
        _emitter.Verify(e => e.EmitGeofenceExitedAsync(It.IsAny<GeofenceAlertDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task RetryPendingAlertsAsync_ExitPending_EmitsTheExitWithItsDwell()
    {
        var visit = Pending(entryPending: false, exitPending: true, departure: new DateTimeOffset(2026, 9, 27, 10, 30, 0, TimeSpan.Zero));
        _reader.Setup(r => r.GetPendingVisitAlertsAsync(It.IsAny<CancellationToken>())).ReturnsAsync([visit]);

        var emitted = await CreateService().RetryPendingAlertsAsync(CancellationToken.None);

        Assert.That(emitted, Is.EqualTo(1));
        _emitter.Verify(e => e.EmitGeofenceExitedAsync(It.Is<GeofenceAlertDto>(a => a.GeofenceEventId == visit.GeofenceEventId && a.DwellSeconds == 1800), It.IsAny<CancellationToken>()), Times.Once);
        _writer.Verify(w => w.StampExitAlertedAsync(visit.GeofenceEventId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task RetryPendingAlertsAsync_EmitterFails_LeavesTheVisitUnstampedAndContinues()
    {
        var failing = Pending(entryPending: true, exitPending: false);
        var healthy = Pending(entryPending: true, exitPending: false);
        _reader.Setup(r => r.GetPendingVisitAlertsAsync(It.IsAny<CancellationToken>())).ReturnsAsync([failing, healthy]);
        _emitter.Setup(e => e.EmitGeofenceEnteredAsync(It.Is<GeofenceAlertDto>(a => a.GeofenceEventId == failing.GeofenceEventId), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("Manager is down"));

        var emitted = await CreateService().RetryPendingAlertsAsync(CancellationToken.None);

        Assert.That(emitted, Is.EqualTo(1));
        _writer.Verify(w => w.StampEntryAlertedAsync(failing.GeofenceEventId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
        _writer.Verify(w => w.StampEntryAlertedAsync(healthy.GeofenceEventId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task RetryPendingAlertsAsync_GeofenceNoLongerAlertsOnEntry_StampsWithoutEmitting()
    {
        var visit = Pending(entryPending: true, exitPending: false, alertOnEntry: false);
        _reader.Setup(r => r.GetPendingVisitAlertsAsync(It.IsAny<CancellationToken>())).ReturnsAsync([visit]);

        var emitted = await CreateService().RetryPendingAlertsAsync(CancellationToken.None);

        Assert.That(emitted, Is.Zero);
        _emitter.Verify(e => e.EmitGeofenceEnteredAsync(It.IsAny<GeofenceAlertDto>(), It.IsAny<CancellationToken>()), Times.Never);
        _writer.Verify(w => w.StampEntryAlertedAsync(visit.GeofenceEventId, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
