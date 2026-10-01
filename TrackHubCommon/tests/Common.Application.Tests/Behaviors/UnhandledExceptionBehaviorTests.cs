using Common.Application.Behaviors;
using Common.Mediator;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace Common.Application.Tests.Behaviors;

public class TestUnhandledRequest : IRequest<string> { }

public class UnhandledExceptionBehaviorTests
{
    [Fact]
    public async Task Handle_NoException_ReturnsResult()
    {
        var logger = NullLogger<TestUnhandledRequest>.Instance;
        var behavior = new UnhandledExceptionBehavior<TestUnhandledRequest, string>(logger);
        var result = await behavior.HandleAsync(new TestUnhandledRequest(), () => Task.FromResult("OK"), CancellationToken.None);
        result.Should().Be("OK");
    }

    [Fact]
    public async Task Handle_WithException_LogsAndRethrows()
    {
        var logger = NullLogger<TestUnhandledRequest>.Instance;
        var behavior = new UnhandledExceptionBehavior<TestUnhandledRequest, string>(logger);
        var act = () => behavior.HandleAsync(
            new TestUnhandledRequest(),
            () => throw new InvalidOperationException("boom"),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>().WithMessage("boom");
    }

    [Fact]
    public async Task Handle_AClassifiedRefusal_IsLoggedBelowWarning()
    {
        var logger = new LevelRecorder();
        var behavior = new UnhandledExceptionBehavior<TestUnhandledRequest, string>(logger, null, [new EverythingExpected()]);
        var act = () => behavior.HandleAsync(new TestUnhandledRequest(), () => throw new InvalidOperationException("stale"), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>();
        logger.Levels.Should().Equal(LogLevel.Information);
    }

    private sealed class EverythingExpected : Common.Application.Interfaces.IExpectedOutcomeClassifier
    {
        public bool IsExpected(Exception exception) => true;
    }

    private sealed class LevelRecorder : ILogger<TestUnhandledRequest>
    {
        public List<LogLevel> Levels { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            => Levels.Add(logLevel);
    }
}
