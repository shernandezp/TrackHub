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

using TrackHub.Router.Domain.Helpers;
using TrackHub.Router.Domain.Models;

namespace TrackHub.Router.Infrastructure.Tests;

[TestFixture]
public class OperatorSyncBackoffTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 17, 12, 0, 0, TimeSpan.Zero);

    private static OperatorVm Operator(int failures, DateTimeOffset? retryAt)
        => new(Guid.NewGuid(), 1, Guid.NewGuid(), null, SyncFailureCount: failures, SyncRetryAt: retryAt);

    [Test]
    public void NoPersistedWindow_IsNotInBackoff()
        => Assert.That(OperatorSyncBackoffPolicy.IsInBackoff(Operator(0, null), Now), Is.False);

    [Test]
    public void PersistedWindow_HoldsTheOperatorUntilItElapses()
    {
        var op = Operator(1, OperatorSyncBackoffPolicy.NextRetryAt(1, Now));

        Assert.Multiple(() =>
        {
            Assert.That(OperatorSyncBackoffPolicy.IsInBackoff(op, Now.AddSeconds(30)), Is.True);
            Assert.That(OperatorSyncBackoffPolicy.IsInBackoff(op, Now.AddMinutes(1).AddSeconds(1)), Is.False);
        });
    }

    [TestCase(1, 1)]
    [TestCase(2, 2)]
    [TestCase(3, 4)]
    [TestCase(5, 16)]
    [TestCase(6, 30)]
    [TestCase(40, 30)]
    public void Window_GrowsExponentially_AndIsCappedAtThirtyMinutes(int failures, int minutes)
        => Assert.That(OperatorSyncBackoffPolicy.NextRetryAt(failures, Now), Is.EqualTo(Now.AddMinutes(minutes)));
}
