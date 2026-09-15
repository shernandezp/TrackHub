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
using TrackHub.Security.Application.Outbox;
using TrackHub.Security.Application.Users.Events;
using TrackHub.Security.Domain.Constants;

namespace Application.UnitTests.Events;

[TestFixture]
public class UserUpdatedEventTests
{
    [Test]
    public async Task Handle_EnqueuesUserUpdatedWithIdAndPayload()
    {
        var outbox = new Mock<IOutboxWriter>();
        var userId = Guid.NewGuid();
        var user = new UpdateUserShrankDto(userId, "updated", true);
        string? payload = null;
        outbox.Setup(w => w.EnqueueAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
            .Callback<string, string, string?, CancellationToken>((_, json, _, _) => payload = json);

        await new UserUpdated.Notification.EventHandler(outbox.Object)
            .Handle(new UserUpdated.Notification(userId, user), CancellationToken.None);

        outbox.Verify(w => w.EnqueueAsync(
            OutboxMessageTypes.UserUpdated, It.IsAny<string>(), userId.ToString(), It.IsAny<CancellationToken>()), Times.Once);

        var restored = JsonSerializer.Deserialize<UserMirrorUpdate>(payload!);
        Assert.Multiple(() =>
        {
            Assert.That(restored.UserId, Is.EqualTo(userId));
            Assert.That(restored.User.Username, Is.EqualTo("updated"));
        });
    }
}
