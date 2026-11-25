using Common.Application.Exceptions;
using Common.Domain.Enums;
using Common.Web.Infrastructure;
using FluentAssertions;
using HotChocolate;

namespace Common.Web.Tests.Infrastructure;

/// <summary>
/// The filter is the only thing that turns a domain exception into a code a client can branch on; handler
/// tests assert on the thrown exception, never on what a GraphQL caller receives.
/// </summary>
public class TrackHubGraphQLErrorFilterTests
{
    private readonly TrackHubGraphQLErrorFilter _filter = new();

    private static IError ErrorFor(Exception exception)
        => ErrorBuilder.New().SetMessage("original").SetException(exception).Build();

    [Fact]
    public void OnError_ValidationExceptionWithCode_SurfacesThatCode()
    {
        var exception = new ValidationException(
            "TRIP_NOT_ACTIVE",
            [new FluentValidation.Results.ValidationFailure("TripId", "TRIP_NOT_ACTIVE")]);

        var result = _filter.OnError(ErrorFor(exception));

        result.Code.Should().Be("TRIP_NOT_ACTIVE");
    }

    [Fact]
    public void OnError_ValidationExceptionWithoutCode_FallsBackToTheGenericCode()
    {
        var exception = new ValidationException(
            [new FluentValidation.Results.ValidationFailure("Name", "Required")]);

        var result = _filter.OnError(ErrorFor(exception));

        result.Code.Should().Be(ValidationException.DefaultCode);
    }

    [Fact]
    public void OnError_ValidationException_CarriesFieldFailuresSoAFormCanHighlightTheInput()
    {
        var exception = new ValidationException(
            [new FluentValidation.Results.ValidationFailure("Code", "Required")]);

        var result = _filter.OnError(ErrorFor(exception));

        result.Extensions.Should().ContainKey("errors");
        result.Extensions!["errors"].Should().BeAssignableTo<IDictionary<string, object?>>()
            .Which["Code"].Should().BeEquivalentTo(new[] { "Required" });
    }

    [Fact]
    public void OnError_ConflictExceptionWithCode_SurfacesThatCodeNotAFlatConflict()
    {
        var result = _filter.OnError(ErrorFor(ConflictException.WithCode("STOP_ALREADY_DEPARTED")));

        result.Code.Should().Be("STOP_ALREADY_DEPARTED");
    }

    [Fact]
    public void OnError_ConflictExceptionWithProseMessage_KeepsTheGenericCode()
    {
        // The shape used by Manager and Security, which pass a human sentence and no code; their contract
        // must not change because a code-carrying overload exists.
        var result = _filter.OnError(ErrorFor(new ConflictException("An identical subscription already exists.")));

        result.Code.Should().Be(ConflictException.DefaultCode);
        result.Message.Should().Be("An identical subscription already exists.");
    }

    [Theory]
    [InlineData("FEATURE_DISABLED")]
    [InlineData("ACCOUNT_SUSPENDED")]
    [InlineData("UNAUTHORIZED")]
    public void OnError_ExistingBranches_StillMapAsBefore(string expected)
    {
        Exception exception = expected switch
        {
            "FEATURE_DISABLED" => new FeatureDisabledException("trip-management", Guid.NewGuid()),
            "ACCOUNT_SUSPENDED" => new AccountSuspendedException(Guid.NewGuid(), AccountStatus.Suspended),
            _ => new UnauthorizedAccessException(),
        };

        _filter.OnError(ErrorFor(exception)).Code.Should().Be(expected);
    }

    [Fact]
    public void OnError_NotFoundException_IsMappedRatherThanFallingThrough()
    {
        // Cross-account ids are deliberately answered NotFound so they cannot be probed, so this branch
        // carries the platform's whole non-disclosure story on GraphQL.
        var result = _filter.OnError(ErrorFor(new Ardalis.GuardClauses.NotFoundException("abc", "Transporter")));

        result.Code.Should().Be("NOT_FOUND");
    }

    [Fact]
    public void OnError_UnrecognisedException_IsLeftUntouched()
    {
        var error = ErrorFor(new InvalidOperationException("boom"));

        _filter.OnError(error).Should().BeSameAs(error);
    }
}
