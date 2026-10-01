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

using TrackHub.Router.Domain.Exceptions;
using TrackHub.Router.Domain.Helpers;
using TrackHub.Router.Domain.Models;

namespace TrackHub.Router.Infrastructure.Tests;

[TestFixture]
public class ProviderConcurrencyTests
{
    private static DeviceTransporterVm Device(int identifier) => new() { TransporterId = Guid.NewGuid(), Identifier = identifier };

    [Test]
    public async Task ReadEachDeviceAsync_ReturnsEveryReadPosition_AndDropsEmptyReads()
    {
        var devices = new[] { Device(1), Device(2), Device(3) };

        var positions = await ProviderConcurrency.ReadEachDeviceAsync(
            devices,
            (device, _) => Task.FromResult(device.Identifier == 2 ? default : new PositionVm { TransporterId = device.TransporterId }),
            CancellationToken.None);

        Assert.That(positions.Select(p => p.TransporterId), Is.EquivalentTo(new[] { devices[0].TransporterId, devices[2].TransporterId }));
    }

    [Test]
    public void ReadEachDeviceAsync_OneFailingDevice_KeepsTheOthersAndReportsAPartialRead()
    {
        var devices = new[] { Device(1), Device(2), Device(3) };

        var ex = Assert.ThrowsAsync<PartialPositionReadException>(() => ProviderConcurrency.ReadEachDeviceAsync(
            devices,
            (device, _) => device.Identifier == 2
                ? throw new HttpRequestException("timeout")
                : Task.FromResult(new PositionVm { TransporterId = device.TransporterId }),
            CancellationToken.None));

        using (Assert.EnterMultipleScope())
        {
            Assert.That(ex!.Positions, Has.Count.EqualTo(2));
            Assert.That(ex.FailedDevices, Is.EqualTo(1));
            Assert.That(ex.TotalDevices, Is.EqualTo(3));
            Assert.That(ex.InnerException, Is.TypeOf<HttpRequestException>());
        }
    }

    [Test]
    public void ReadEachDeviceAsync_Cancellation_IsNotReportedAsADeviceFailure()
    {
        using var cts = new CancellationTokenSource();
        cts.Cancel();

        Assert.CatchAsync<OperationCanceledException>(() => ProviderConcurrency.ReadEachDeviceAsync(
            [Device(1)],
            (_, token) => Task.FromCanceled<PositionVm>(token),
            cts.Token));
    }
}
