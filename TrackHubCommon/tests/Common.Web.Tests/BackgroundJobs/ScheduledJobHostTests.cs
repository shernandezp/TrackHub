using Common.Application.BackgroundJobs;
using Common.Web.BackgroundJobs;
using FluentAssertions;

namespace Common.Web.Tests.BackgroundJobs;

public class ScheduledJobHostTests
{
    private sealed class FastJob : IScheduledJob
    {
        public static TimeSpan Interval => TimeSpan.FromSeconds(30);
        public static TimeSpan StartupDelay => TimeSpan.FromMinutes(1);
        public Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken) => Task.CompletedTask;
    }

    private sealed class DailyJob : IScheduledJob
    {
        public static TimeSpan Interval => TimeSpan.FromHours(24);
        public static TimeSpan StartupDelay => TimeSpan.FromMinutes(10);
        public Task RunOnceAsync(DateTimeOffset now, CancellationToken cancellationToken) => Task.CompletedTask;
    }

    [Fact]
    public void ASuccessfulCycleWaitsTheJobsOwnInterval()
        => ScheduledJobHost<FastJob>.NextDelay(0).Should().Be(TimeSpan.FromSeconds(30));

    [Theory]
    [InlineData(1, 60)]
    [InlineData(2, 120)]
    [InlineData(3, 240)]
    public void ConsecutiveFailuresDoubleTheWait(int failures, int expectedSeconds)
        => ScheduledJobHost<FastJob>.NextDelay(failures).Should().Be(TimeSpan.FromSeconds(expectedSeconds));

    [Fact]
    public void TheBackoffIsCappedAtAQuarterHour()
        => ScheduledJobHost<FastJob>.NextDelay(99).Should().Be(TimeSpan.FromMinutes(15));

    // A daily job that fails must wait until tomorrow, not retry every quarter hour.
    [Fact]
    public void ALongIntervalIsItsOwnFloor()
        => ScheduledJobHost<DailyJob>.NextDelay(99).Should().Be(TimeSpan.FromHours(24));
}
