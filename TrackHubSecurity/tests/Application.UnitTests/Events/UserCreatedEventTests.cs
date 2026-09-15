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
using TrackHub.Security.Application.Users.Events;
using TrackHub.Security.Domain.Constants;

namespace Application.UnitTests.Events;

// The mirror is RECORDED, not called: the Security user row is already committed by the time the
// notification fires, so a Manager outage must leave a durable row rather than a lost replica.
[TestFixture]
public class UserCreatedEventTests
{
    private Mock<IOutboxWriter> _outboxMock;

    [SetUp]
    public void SetUp() => _outboxMock = new Mock<IOutboxWriter>();

    [Test]
    public async Task Handle_ValidNotification_EnqueuesUserCreatedMessage()
    {
        var user = new UserShrankDto(Guid.NewGuid(), "newuser", Guid.NewGuid(), true);
        var handler = new UserCreated.Notification.EventHandler(_outboxMock.Object);

        await handler.Handle(new UserCreated.Notification(user), CancellationToken.None);

        // The ordering key is what keeps a later delete from overtaking this create.
        _outboxMock.Verify(w => w.EnqueueAsync(
            OutboxMessageTypes.UserCreated, It.IsAny<string>(), user.UserId.ToString(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public async Task Handle_PayloadRoundTripsTheExactUserDto()
    {
        var userId = Guid.NewGuid();
        var accountId = Guid.NewGuid();
        var user = new UserShrankDto(userId, "testuser", accountId, true);
        string? payload = null;
        _outboxMock.Setup(w => w.EnqueueAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, string?, CancellationToken>((_, json, _, _) => payload = json);

        await new UserCreated.Notification.EventHandler(_outboxMock.Object)
            .Handle(new UserCreated.Notification(user), CancellationToken.None);

        var restored = JsonSerializer.Deserialize<UserShrankDto>(payload!);
        Assert.Multiple(() =>
        {
            Assert.That(restored.UserId, Is.EqualTo(userId));
            Assert.That(restored.Username, Is.EqualTo("testuser"));
            Assert.That(restored.AccountId, Is.EqualTo(accountId));
        });
    }
}
