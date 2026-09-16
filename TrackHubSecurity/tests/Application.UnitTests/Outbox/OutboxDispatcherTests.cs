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
using Microsoft.Extensions.Logging;
using TrackHub.Security.Application.Outbox;
using TrackHub.Security.Domain.Constants;

namespace Application.UnitTests.Outbox;

[TestFixture]
public class OutboxDispatcherTests
{
    private Mock<IOutboxReader> _reader;
    private Mock<IOutboxWriter> _writer;
    private Mock<IManagerWriter> _managerWriter;
    private Mock<IManagerAuditWriter> _auditWriter;

    [SetUp]
    public void SetUp()
    {
        _reader = new Mock<IOutboxReader>();
        _writer = new Mock<IOutboxWriter>();
        _writer.Setup(w => w.TryClaimAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        _managerWriter = new Mock<IManagerWriter>();
        _auditWriter = new Mock<IManagerAuditWriter>();
    }

    private OutboxDispatcher CreateDispatcher() => new(
        _reader.Object, _writer.Object, _managerWriter.Object, _auditWriter.Object,
        new Mock<ILogger<OutboxDispatcher>>().Object);

    private void Due(params OutboxMessageVm[] messages)
        => _reader.Setup(r => r.GetDispatchableAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(messages);

    [Test]
    public async Task DispatchDue_UserCreated_MirrorsAndCompletes()
    {
        var user = new UserShrankDto(Guid.NewGuid(), "u", Guid.NewGuid(), true);
        var messageId = Guid.NewGuid();
        Due(new OutboxMessageVm(messageId, OutboxMessageTypes.UserCreated, JsonSerializer.Serialize(user), 0));

        var result = await CreateDispatcher().DispatchDueAsync(CancellationToken.None);

        _managerWriter.Verify(w => w.CreateUserAsync(
            It.Is<UserShrankDto>(u => u.UserId == user.UserId), It.IsAny<CancellationToken>()), Times.Once);
        _writer.Verify(w => w.MarkCompletedAsync(messageId, It.IsAny<CancellationToken>()), Times.Once);
        Assert.That(result.Completed, Is.EqualTo(1));
    }

    [Test]
    public async Task DispatchDue_ManagerDown_RecordsTheAttemptAndKeepsGoing()
    {
        var messageId = Guid.NewGuid();
        var otherId = Guid.NewGuid();
        _managerWriter.Setup(w => w.DeleteUserAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("Manager down"));
        Due(
            new OutboxMessageVm(messageId, OutboxMessageTypes.UserDeleted, JsonSerializer.Serialize(Guid.NewGuid()), 0),
            new OutboxMessageVm(otherId, OutboxMessageTypes.AuditEvent, JsonSerializer.Serialize(
                new SecurityAuditEventDto(Guid.NewGuid(), "User", "a", "DeleteUser", "User", "1", null, null, null)), 0));

        var result = await CreateDispatcher().DispatchDueAsync(CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(result.Completed, Is.EqualTo(1), "one bad message must not stop the batch");
            Assert.That(result.GaveUp, Is.Zero);
        });
        _writer.Verify(w => w.MarkAttemptFailedAsync(messageId, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        _writer.Verify(w => w.MarkCompletedAsync(messageId, It.IsAny<CancellationToken>()), Times.Never);
    }

    [Test]
    public async Task DispatchDue_LastAttempt_IsReportedAsGivenUp()
    {
        _managerWriter.Setup(w => w.DeleteUserAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new HttpRequestException("Manager down"));
        Due(new OutboxMessageVm(Guid.NewGuid(), OutboxMessageTypes.UserDeleted,
            JsonSerializer.Serialize(Guid.NewGuid()), OutboxPolicy.MaxAttempts - 1));

        var result = await CreateDispatcher().DispatchDueAsync(CancellationToken.None);

        Assert.That(result.GaveUp, Is.EqualTo(1));
    }

    [Test]
    public async Task DispatchDue_UnknownMessageType_FailsThatMessageOnly()
    {
        var messageId = Guid.NewGuid();
        Due(new OutboxMessageVm(messageId, "Nonsense", "{}", 0));

        var result = await CreateDispatcher().DispatchDueAsync(CancellationToken.None);

        Assert.That(result.Completed, Is.Zero);
        _writer.Verify(w => w.MarkAttemptFailedAsync(messageId, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
