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

using Microsoft.EntityFrameworkCore;
using TrackHub.Security.Domain.Constants;
using TrackHub.Security.Infrastructure;
using TrackHub.Security.Infrastructure.Entities;
using TrackHub.Security.Infrastructure.Readers;

namespace Infrastructure.UnitTests;

/// <summary>
/// The ordering rule is the whole point of the outbox: a delete that overtakes its create leaves a
/// replica in Manager that nothing will ever remove. NoTracking mirrors the real registration.
/// </summary>
[TestFixture]
public class OutboxReaderTests
{
    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(name)
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .Options);

    private static OutboxMessage Message(string type, string? orderingKey, DateTimeOffset? nextAttemptAt = null)
        => new(type, "{}", orderingKey) { NextAttemptAt = nextAttemptAt ?? DateTimeOffset.UtcNow.AddMinutes(-1) };

    [Test]
    public async Task GetDispatchable_TwoMessagesForOneUser_ReturnsOnlyTheOlder()
    {
        using var context = NewContext(Guid.NewGuid().ToString());
        var userId = Guid.NewGuid().ToString();
        context.OutboxMessages.Add(Message(OutboxMessageTypes.UserCreated, userId));
        context.OutboxMessages.Add(Message(OutboxMessageTypes.UserDeleted, userId));
        await context.SaveChangesAsync(CancellationToken.None);

        var due = await new OutboxReader(context).GetDispatchableAsync(50, CancellationToken.None);

        Assert.That(due, Has.Count.EqualTo(1));
        Assert.That(due.Single().MessageType, Is.EqualTo(OutboxMessageTypes.UserCreated));
    }

    [Test]
    public async Task GetDispatchable_HeadOfKeyIsBackingOff_HoldsTheRestOfThatKey()
    {
        using var context = NewContext(Guid.NewGuid().ToString());
        var userId = Guid.NewGuid().ToString();
        // The create failed and is waiting out its backoff; the delete behind it is due.
        context.OutboxMessages.Add(Message(OutboxMessageTypes.UserCreated, userId, DateTimeOffset.UtcNow.AddMinutes(5)));
        context.OutboxMessages.Add(Message(OutboxMessageTypes.UserDeleted, userId));
        await context.SaveChangesAsync(CancellationToken.None);

        var due = await new OutboxReader(context).GetDispatchableAsync(50, CancellationToken.None);

        Assert.That(due, Is.Empty, "the delete must not overtake the create it depends on");
    }

    [Test]
    public async Task GetDispatchable_OneStuckUser_DoesNotBlockAnother()
    {
        using var context = NewContext(Guid.NewGuid().ToString());
        var stuck = Guid.NewGuid().ToString();
        var other = Guid.NewGuid().ToString();
        context.OutboxMessages.Add(Message(OutboxMessageTypes.UserCreated, stuck, DateTimeOffset.UtcNow.AddMinutes(5)));
        context.OutboxMessages.Add(Message(OutboxMessageTypes.UserCreated, other));
        await context.SaveChangesAsync(CancellationToken.None);

        var due = await new OutboxReader(context).GetDispatchableAsync(50, CancellationToken.None);

        Assert.That(due, Has.Count.EqualTo(1));
    }

    [Test]
    public async Task GetDispatchable_AuditRowsHaveNoKey_AndNeverBlockEachOther()
    {
        using var context = NewContext(Guid.NewGuid().ToString());
        context.OutboxMessages.Add(Message(OutboxMessageTypes.AuditEvent, null));
        context.OutboxMessages.Add(Message(OutboxMessageTypes.AuditEvent, null));
        context.OutboxMessages.Add(Message(OutboxMessageTypes.AuditEvent, null));
        await context.SaveChangesAsync(CancellationToken.None);

        var due = await new OutboxReader(context).GetDispatchableAsync(50, CancellationToken.None);

        Assert.That(due, Has.Count.EqualTo(3), "a stuck user mirror must never hold up the audit trail");
    }

    [Test]
    public async Task GetDispatchable_IgnoresCompletedAndFailed()
    {
        using var context = NewContext(Guid.NewGuid().ToString());
        context.OutboxMessages.Add(new OutboxMessage(OutboxMessageTypes.AuditEvent, "{}", null)
        {
            Status = OutboxMessageStatuses.Completed,
        });
        context.OutboxMessages.Add(new OutboxMessage(OutboxMessageTypes.AuditEvent, "{}", null)
        {
            Status = OutboxMessageStatuses.Failed,
        });
        await context.SaveChangesAsync(CancellationToken.None);

        var due = await new OutboxReader(context).GetDispatchableAsync(50, CancellationToken.None);

        Assert.That(due, Is.Empty);
    }
}
