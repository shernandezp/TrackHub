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

public class FeedCursorTests
{
    [Fact]
    public void Round_trips_the_instant_and_the_id()
    {
        var at = new DateTimeOffset(2026, 9, 17, 4, 5, 6, 789, TimeSpan.FromHours(-5));
        var id = Guid.NewGuid();

        FeedCursor.TryDecode(FeedCursor.Encode(at, id), out var decodedAt, out var decodedId).Should().BeTrue();

        decodedAt.Should().Be(at);
        decodedId.Should().Be(id);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Reads_an_absent_cursor_as_the_first_page(string? cursor)
        => FeedCursor.TryDecode(cursor, out _, out _).Should().BeFalse();

    [Theory]
    [InlineData("not base64 at all")]
    [InlineData("bm90LWEtY3Vyc29y")]
    public void Refuses_a_cursor_it_did_not_issue(string cursor)
        => FluentActions.Invoking(() => FeedCursor.TryDecode(cursor, out _, out _))
            .Should().Throw<Common.Application.Exceptions.ValidationException>()
            .Which.Code.Should().Be(FeedCursor.InvalidCursorCode);
}
