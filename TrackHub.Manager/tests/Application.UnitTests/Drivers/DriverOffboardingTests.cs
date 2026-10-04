// Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

using TrackHub.Manager.Application.Drivers.Commands;
using TrackHub.Manager.Domain.Interfaces;
using TrackHub.Manager.Domain.Models;
using TrackHub.Manager.Domain.Records;

namespace TrackHub.Manager.Application.UnitTests.Drivers;

// Deactivating a driver must end their sign-in credential in Security, and must do so BEFORE the
// local write so a Security outage leaves the driver active rather than deactivated-but-signing-in.
[TestFixture]
public class DriverOffboardingTests
{
    private static readonly Guid DriverId = Guid.NewGuid();
    private static readonly Guid AccountId = Guid.NewGuid();

    private Mock<IDriverReader> _reader = null!;
    private Mock<IDriverCredentialRevoker> _revoker = null!;
    private Mock<IDriverWriter> _writer = null!;
    private readonly List<string> _calls = [];

    [SetUp]
    public void SetUp()
    {
        _calls.Clear();
        _reader = new Mock<IDriverReader>();
        _revoker = new Mock<IDriverCredentialRevoker>();
        _writer = new Mock<IDriverWriter>();
        _revoker.Setup(r => r.RevokeDriverCredentialsAsync(DriverId, AccountId, It.IsAny<CancellationToken>()))
            .Callback(() => _calls.Add("revoke")).Returns(Task.CompletedTask);
        _writer.Setup(w => w.DeactivateDriverAsync(DriverId, It.IsAny<CancellationToken>()))
            .Callback(() => _calls.Add("write")).Returns(Task.CompletedTask);
        _writer.Setup(w => w.UpdateDriverAsync(DriverId, It.IsAny<DriverDto>(), It.IsAny<CancellationToken>()))
            .Callback(() => _calls.Add("write")).Returns(Task.CompletedTask);
    }

    private void CurrentDriver(bool active)
        => _reader.Setup(r => r.GetDriverAsync(DriverId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new DriverVm(DriverId, AccountId, "Driver", null, null, null, active, null, null, null, null, DateTimeOffset.UtcNow, 0));

    private static DriverDto Dto(bool active) => new() { AccountId = AccountId, Name = "Driver", Active = active };

    [Test]
    public async Task Deactivate_RevokesCredentialsBeforeTheLocalWrite()
    {
        CurrentDriver(active: true);

        await new DeactivateDriverCommandHandler(_reader.Object, _revoker.Object, _writer.Object)
            .Handle(new DeactivateDriverCommand(DriverId), CancellationToken.None);

        Assert.That(_calls, Is.EqualTo(new[] { "revoke", "write" }));
    }

    [Test]
    public async Task Deactivate_WhenSecurityRefuses_LeavesTheDriverActive()
    {
        CurrentDriver(active: true);
        _revoker.Setup(r => r.RevokeDriverCredentialsAsync(DriverId, AccountId, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("security down"));

        await Assert.ThrowsAsync<HttpRequestException>(() => new DeactivateDriverCommandHandler(_reader.Object, _revoker.Object, _writer.Object)
            .Handle(new DeactivateDriverCommand(DriverId), CancellationToken.None));

        _writer.Verify(w => w.DeactivateDriverAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task Update_ThatDeactivates_RevokesCredentialsFirst()
    {
        CurrentDriver(active: true);

        await new UpdateDriverCommandHandler(_reader.Object, _revoker.Object, _writer.Object)
            .Handle(new UpdateDriverCommand(DriverId, Dto(active: false)), CancellationToken.None);

        Assert.That(_calls, Is.EqualTo(new[] { "revoke", "write" }));
    }

    [Test]
    public async Task Update_ThatKeepsTheDriverActive_DoesNotTouchSecurity()
    {
        CurrentDriver(active: true);

        await new UpdateDriverCommandHandler(_reader.Object, _revoker.Object, _writer.Object)
            .Handle(new UpdateDriverCommand(DriverId, Dto(active: true)), CancellationToken.None);

        _revoker.VerifyNoOtherCalls();
        Assert.That(_calls, Is.EqualTo(new[] { "write" }));
    }

    [Test]
    public async Task Update_OfAnAlreadyInactiveDriver_DoesNotTouchSecurity()
    {
        CurrentDriver(active: false);

        await new UpdateDriverCommandHandler(_reader.Object, _revoker.Object, _writer.Object)
            .Handle(new UpdateDriverCommand(DriverId, Dto(active: false)), CancellationToken.None);

        _revoker.VerifyNoOtherCalls();
    }
}
