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

using TrackHub.Manager.Application.Lookups;

namespace Application.UnitTests.Lookups;

[TestFixture]
public class UnpagedReadLimitsTests
{
    [Test]
    public void UnpagedReadLimits_ThrowsPastTheCeilingRatherThanTruncating()
    {
        var rows = Enumerable.Range(0, UnpagedReadLimits.Ceiling + 1).ToList();

        var ex = Assert.Throws<Common.Application.Exceptions.ValidationException>(
            () => UnpagedReadLimits.EnsureWithinCeiling(rows, "assignedDeviceTransportersByOperator"));

        Assert.That(ex!.Code, Is.EqualTo(UnpagedReadLimits.LimitExceededCode));
    }

    [Test]
    public void UnpagedReadLimits_ReturnsTheWholeSetBelowTheCeiling()
    {
        var rows = Enumerable.Range(0, 3_000).ToList();

        var result = UnpagedReadLimits.EnsureWithinCeiling(rows, "assignedDeviceTransportersByOperator");

        Assert.That(result, Has.Count.EqualTo(3_000));
    }
}
