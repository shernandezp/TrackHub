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

using TrackHub.Reporting.Application.Report.Factory;
using TrackHub.Reporting.Domain.Exceptions;
using TrackHub.Reporting.Domain.Records;

namespace TrackHub.Reporting.Application.UnitTests;

[TestFixture]
public class ReportCalendarTests
{
    private static FilterDto Window(DateTimeOffset from, DateTimeOffset to)
        => new() { Values = FilterValues.Of((FilterNames.From, from.ToString("O")), (FilterNames.To, to.ToString("O"))) };

    private static readonly DateTimeOffset Start = new(2026, 1, 1, 0, 0, 0, TimeSpan.Zero);

    [Test]
    public void AWindowReversedByLessThanADay_IsRefused()
        => Assert.Throws<ReportWindowInvalidException>(() => ReportCalendar.Window(Window(Start, Start.AddHours(-3))));

    [Test]
    public void APeriodCountsItsDaysInclusively_SoFourHundredDaysIsTheLongestAllowed()
    {
        Assert.DoesNotThrow(() => ReportCalendar.Period(Window(Start, Start.AddDays(399)), null));
        Assert.Throws<ReportWindowInvalidException>(() => ReportCalendar.Period(Window(Start, Start.AddDays(400)), null));
    }
}
