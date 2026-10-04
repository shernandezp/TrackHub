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

using System.Text.Json;
using TrackHub.Router.Domain.Records;
using TrackHub.Router.Infrastructure.Navixy.Models;
using TrackHub.Router.Infrastructure.Tests;

namespace TrackHub.Router.Infrastructure.Navixy.Tests;

[TestFixture]
public class PositionReaderTests : PositionReaderTestsBase<PositionReader>
{
    protected override PositionReader CreatePositionReader(
        ICredentialHttpClientFactory httpClientFactory,
        IHttpClientService httpClientService)
        => new(httpClientFactory, httpClientService, SessionStoreMock.Object);

    [Test]
    public async Task GetDevicePositionAsync_WithNullResponse_ThrowsInvalidOperationException()
    {
        // Arrange
        var deviceDto = CreateDeviceTransporterVm(1, "TestDevice");
        var response = new TrackerListResponse(true, null);

        HttpClientServiceMock.Setup(x => x.PostAsync<TrackerListResponse>(It.IsAny<string>(), It.IsAny<object>(), TestCancellationToken))
            .ReturnsAsync(response);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            async () => await PositionReader.GetDevicePositionAsync(deviceDto, TestCancellationToken));
    }

    [Test]
    public async Task GetDevicePositionAsync_WithMultipleDevices_ReturnsEmptyList()
    {
        // Arrange
        var devices = CreateDeviceTransporterVmList(1, 2);
        var response = new TrackerListResponse(true, null);

        HttpClientServiceMock.Setup(x => x.PostAsync<TrackerListResponse>(It.IsAny<string>(), It.IsAny<object>(), TestCancellationToken))
            .ReturnsAsync(response);

        // Act
        var result = await PositionReader.GetDevicePositionAsync(devices, TestCancellationToken);

        // Assert
        AssertIsEmpty(result);
    }

    [Test]
    public async Task GetPositionAsync_WithDateRange_ReturnsEmptyList()
    {
        // Arrange
        var deviceDto = CreateDeviceTransporterVm(1, "TestDevice");
        var from = DateTimeOffset.Now.AddHours(-1);
        var to = DateTimeOffset.Now;
        var response = new TrackReadResponse(true, false, null);

        HttpClientServiceMock.Setup(x => x.PostAsync<TrackReadResponse>(It.IsAny<string>(), It.IsAny<object>(), TestCancellationToken))
            .ReturnsAsync(response);

        // Act
        var result = await PositionReader.GetPositionAsync(from, to, deviceDto, TestCancellationToken);

        // Assert
        AssertIsEmpty(result);
    }

    [Test]
    public async Task GetPositionAsync_ReadsAndWritesDatesInTheNavixyUserTimeZone()
    {
        var credential = new CredentialTokenDto(Guid.NewGuid(), "https://navixy.test", "user", "secret", null, null, null, null, null, null);
        var deviceDto = CreateDeviceTransporterVm(1, "TestDevice");
        object? sentParameters = null;

        HttpClientFactoryMock.Setup(x => x.CreateClientAsync(credential, TestCancellationToken)).Returns(new HttpClient());
        HttpClientServiceMock.Setup(x => x.PostAsync<AuthResponse>(It.IsAny<string>(), It.IsAny<object>(), TestCancellationToken))
            .ReturnsAsync(new AuthResponse(true, "hash-1"));
        HttpClientServiceMock.Setup(x => x.PostAsync<UserSettingsResponse>(It.IsAny<string>(), It.IsAny<object>(), TestCancellationToken))
            .ReturnsAsync(new UserSettingsResponse(true, new NavixyUserSettings("America/Bogota")));
        HttpClientServiceMock.Setup(x => x.PostAsync<TrackReadResponse>(It.IsAny<string>(), It.IsAny<object>(), TestCancellationToken))
            .Callback<string, object, CancellationToken>((_, parameters, _) => sentParameters = parameters)
            .ReturnsAsync(new TrackReadResponse(true, false,
                [new TrackPoint(4.71, -74.07, 2640, "2026-07-17 04:20:00", 63, 210, null, null, null, null)]));

        await PositionReader.Init(credential, TestCancellationToken);
        var result = (await PositionReader.GetPositionAsync(
            new DateTimeOffset(2026, 7, 17, 5, 0, 0, TimeSpan.Zero),
            new DateTimeOffset(2026, 7, 17, 11, 0, 0, TimeSpan.Zero),
            deviceDto,
            TestCancellationToken)).Single();

        var sent = JsonSerializer.Serialize(sentParameters);
        using (Assert.EnterMultipleScope())
        {
            Assert.That(sent, Does.Contain("\"from\":\"2026-07-17 00:00:00\""));
            Assert.That(sent, Does.Contain("\"to\":\"2026-07-17 06:00:00\""));
            Assert.That(result.DeviceDateTime, Is.EqualTo(new DateTimeOffset(2026, 7, 17, 9, 20, 0, TimeSpan.Zero)));
        }
        SessionStoreMock.Verify(x => x.Set(credential, It.Is<string>(s => s.Contains("America/Bogota")), It.IsAny<TimeSpan>(), true), Times.Once);
    }
}
