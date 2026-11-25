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

global using Moq;
global using TrackHub.Router.Domain.Interfaces;
global using TrackHub.Router.Domain.Models;
global using Common.Domain.Enums;

namespace TrackHub.Router.Infrastructure.Tests;

public abstract class DeviceReaderTestsBase<TDeviceReader>
{
    protected Mock<ICredentialHttpClientFactory> HttpClientFactoryMock { get; private set; } = null!;
    protected Mock<IHttpClientService> HttpClientServiceMock { get; private set; } = null!;
    // Default mock: TryGet misses (out param stays default), so readers always log in.
    protected Mock<IProviderSessionStore> SessionStoreMock { get; private set; } = null!;
    protected TDeviceReader DeviceReader { get; private set; } = default!;
    protected CancellationToken TestCancellationToken { get; } = CancellationToken.None;

    protected abstract TDeviceReader CreateDeviceReader(
        ICredentialHttpClientFactory httpClientFactory,
        IHttpClientService httpClientService);

    [SetUp]
    public void BaseSetUp()
    {
        HttpClientFactoryMock = new Mock<ICredentialHttpClientFactory>();
        HttpClientServiceMock = new Mock<IHttpClientService>();
        SessionStoreMock = new Mock<IProviderSessionStore>();
        DeviceReader = CreateDeviceReader(HttpClientFactoryMock.Object, HttpClientServiceMock.Object);
    }

    protected DeviceTransporterVm CreateDeviceTransporterVm(int identifier, string serial = "")
        => new()
        {
            Identifier = identifier,
            Serial = serial
        };

    protected List<DeviceTransporterVm> CreateDeviceTransporterVmList(params int[] identifiers)
        => identifiers.Select(id => CreateDeviceTransporterVm(id)).ToList();

    protected DeviceVm CreateExpectedDeviceVm(
        int identifier = 0,
        string? serial = null,
        string? name = null,
        Guid? deviceId = null)
        => new(
            deviceId ?? Guid.Empty,
            identifier,
            serial ?? string.Empty,
            name ?? string.Empty,
            (short)DeviceType.Cellular,
            (short)TransporterType.Truck
        );

    protected void AssertIsEmpty<T>(IEnumerable<T> result)
    {
        Assert.That(result, Is.Empty);
    }

    protected void AssertIsNotEmpty<T>(IEnumerable<T> result)
    {
        Assert.That(result, Is.Not.Empty);
    }

    // DeviceVm is compared property by property to handle struct equality.
    protected void AssertEquals<T>(T result, T expected)
    {
        if (typeof(T) == typeof(DeviceVm))
        {
            var resultDevice = (DeviceVm)(object)result!;
            var expectedDevice = (DeviceVm)(object)expected!;

            using (Assert.EnterMultipleScope())
            {
                Assert.That(resultDevice.DeviceId, Is.EqualTo(expectedDevice.DeviceId), "DeviceId mismatch");
                Assert.That(resultDevice.Identifier, Is.EqualTo(expectedDevice.Identifier), "Identifier mismatch");
                Assert.That(resultDevice.Serial ?? string.Empty, Is.EqualTo(expectedDevice.Serial ?? string.Empty), "Serial mismatch");
                Assert.That(resultDevice.Name ?? string.Empty, Is.EqualTo(expectedDevice.Name ?? string.Empty), "Name mismatch");
                Assert.That(resultDevice.DeviceTypeId, Is.EqualTo(expectedDevice.DeviceTypeId), "DeviceTypeId mismatch");
                Assert.That(resultDevice.TransporterTypeId, Is.EqualTo(expectedDevice.TransporterTypeId), "TransporterTypeId mismatch");
            }
        }
        else
        {
            Assert.That(result, Is.EqualTo(expected));
        }
    }
}
