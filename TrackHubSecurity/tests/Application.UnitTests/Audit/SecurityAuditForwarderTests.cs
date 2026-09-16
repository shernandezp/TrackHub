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
using TrackHub.Security.Application.Audit.Events;
using TrackHub.Security.Domain.Constants;

namespace Application.UnitTests.Audit;

// Audit forwarding is recorded in the outbox and dispatched later: a Manager outage must cost the
// originating command nothing, and must not cost the audit row either.
[TestFixture]
public class SecurityAuditForwarderTests
{
    private static SecurityAuditForwarder.Notification MakeNotification()
        => new(new SecurityAuditEventDto(Guid.NewGuid(), "User", "actor", "CreateUser", "User", Guid.NewGuid().ToString(), null, "newvalues", "corr"));

    private static SecurityAuditForwarder.Notification.EventHandler MakeHandler(IOutboxWriter outbox)
        => new(outbox, new Mock<ILogger<SecurityAuditForwarder.Notification.EventHandler>>().Object);

    [Test]
    public async Task Handle_RecordsTheEventOnce()
    {
        var outbox = new Mock<IOutboxWriter>();

        await MakeHandler(outbox.Object).Handle(MakeNotification(), CancellationToken.None);

        // Null key: audit rows are independent, so a stuck user mirror never holds them up.
        outbox.Verify(w => w.EnqueueAsync(
            OutboxMessageTypes.AuditEvent, It.IsAny<string>(), null, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Test]
    public void Handle_OutboxThrows_DoesNotBubble()
    {
        var outbox = new Mock<IOutboxWriter>();
        outbox.Setup(w => w.EnqueueAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string?>(), It.IsAny<CancellationToken>()))
              .ThrowsAsync(new InvalidOperationException("database down"));

        var handler = MakeHandler(outbox.Object);

        Assert.DoesNotThrowAsync(async () => await handler.Handle(MakeNotification(), CancellationToken.None));
    }
}
