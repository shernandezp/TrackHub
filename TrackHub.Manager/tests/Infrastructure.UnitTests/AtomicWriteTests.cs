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

using Microsoft.EntityFrameworkCore.Diagnostics;
using TrackHub.Manager.Infrastructure;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.ManagerDB.Writers;

namespace Infrastructure.UnitTests;

[TestFixture]
public class AtomicWriteTests
{
    private static ApplicationDbContext NewContext()
        => new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"atomic-write-{Guid.NewGuid()}")
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options);

    [Test]
    public async Task AFailedAttemptLeavesNothingForTheNextSaveToResend()
    {
        using var context = NewContext();
        var accountId = Guid.NewGuid();

        await Assert.ThrowsAsync<InvalidOperationException>(() => new AtomicWrite(context).RunAsync<int>(() =>
        {
            context.Groups.Add(new Group("Failed attempt", "", true, accountId));
            throw new InvalidOperationException("boom");
        }, CancellationToken.None));

        context.Groups.Add(new Group("Next device", "", true, accountId));
        await context.SaveChangesAsync();

        Assert.That(await context.Groups.Select(g => g.Name).ToListAsync(), Is.EqualTo(new[] { "Next device" }));
    }
}
