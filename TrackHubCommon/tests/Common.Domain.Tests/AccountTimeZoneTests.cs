/**
 * Copyright (c) 2025 Sergio Hernandez. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

using Common.Domain.Time;
using FluentAssertions;
using Xunit;

namespace Common.Domain.Tests;

/// <summary>
/// An account's calendar turns instants into days. An evening instant in Bogotá is the same day
/// locally and the NEXT day in UTC, which is the whole reason the conversion exists.
/// </summary>
public sealed class AccountTimeZoneTests
{
    private static readonly DateTimeOffset LateEvening = new(2026, 6, 15, 23, 30, 0, TimeSpan.FromHours(-5));

    [Fact]
    public void BlankOrUnknown_IsUtc()
    {
        AccountTimeZone.For(null).Id.Should().Be("UTC");
        AccountTimeZone.For("Mars/Olympus").Id.Should().Be("UTC");
        AccountTimeZone.Normalize("  ").Should().Be("UTC");
        AccountTimeZone.IsValid("Mars/Olympus").Should().BeFalse();
        AccountTimeZone.IsValid("America/Bogota").Should().BeTrue();
    }

    [Fact]
    public void Bogota_KeepsTheLocalDay_WhereUtcHasAlreadyRolledOver()
    {
        var bogota = AccountTimeZone.For("America/Bogota");

        bogota.DateOf(LateEvening).Should().Be(new DateOnly(2026, 6, 15));
        AccountTimeZone.Utc.DateOf(LateEvening).Should().Be(new DateOnly(2026, 6, 16));
        bogota.ClockOf(LateEvening).Should().Be(new TimeOnly(23, 30));
    }

    [Fact]
    public void DayBounds_AreLocalMidnights()
    {
        var bogota = AccountTimeZone.For("America/Bogota");
        var day = new DateOnly(2026, 6, 15);

        bogota.StartOf(day).Should().Be(new DateTimeOffset(2026, 6, 15, 0, 0, 0, TimeSpan.FromHours(-5)));
        bogota.EndOf(day).Should().Be(new DateTimeOffset(2026, 6, 16, 0, 0, 0, TimeSpan.FromHours(-5)));
        bogota.DateOf(bogota.EndOf(day).AddTicks(-1)).Should().Be(day);
    }
}
