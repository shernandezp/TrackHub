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

using Common.Application.Paging;
using FluentAssertions;

namespace Common.Application.Tests.Paging;

// A lookup ceiling refuses rather than trims: a truncated picker reads as complete.
public class LookupLimitsTests
{
    [Fact]
    public void Returns_the_set_untouched_at_the_ceiling()
        => LookupLimits.EnsureWithinCeiling(Enumerable.Range(0, LookupLimits.Ceiling).ToList(), "lookup")
            .Should().HaveCount(LookupLimits.Ceiling);

    [Fact]
    public void Refuses_past_the_ceiling_instead_of_truncating()
    {
        var act = () => LookupLimits.EnsureWithinCeiling(Enumerable.Range(0, LookupLimits.FetchSize).ToList(), "lookup");

        var ex = act.Should().Throw<Common.Application.Exceptions.ValidationException>().Which;
        ex.Code.Should().Be(LookupLimits.LimitExceededCode);
        ex.Errors.Should().ContainKey("lookup");
    }

    [Fact]
    public void Fetches_one_past_the_ceiling_so_an_overflow_is_detectable()
        => LookupLimits.FetchSize.Should().Be(LookupLimits.Ceiling + 1);
}
