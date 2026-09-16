using Common.Application.Exceptions;
using Common.Application.Extensions;
using Common.Application.GraphQL.Inputs;
using FluentAssertions;

namespace Common.Application.Tests.Extensions;

public class FiltersExtensionsTests
{
    private static readonly IReadOnlySet<string> Allowed =
        new HashSet<string>(StringComparer.Ordinal) { "Name", "Age" };

    [Fact]
    public void GetFilters_ConvertsFiltersInputToFilters()
    {
        var input = new FiltersInput
        {
            Filters =
            [
                new FilterItemInput { Key = "Name", Value = "Test" },
                new FilterItemInput { Key = "Age", Value = 25 }
            ]
        };

        var result = input.GetFilters(Allowed);
        result.Should().NotBeNull();
        result.Keys.Should().BeEquivalentTo("Name", "Age");
    }

    [Fact]
    public void GetFilters_EmptyFilters_ReturnsFiltersWithNoEntries()
    {
        var input = new FiltersInput { Filters = [] };
        var result = input.GetFilters(Allowed);
        result.Should().NotBeNull();
        result.Keys.Should().BeEmpty();
    }

    [Fact]
    public void GetFilters_KeyOutsideTheAllowList_IsRejected()
    {
        var input = new FiltersInput
        {
            Filters = [new FilterItemInput { Key = "Password", Value = "$2a$11$abc" }]
        };

        var act = () => input.GetFilters(Allowed);

        act.Should().Throw<ValidationException>()
            .Which.Errors.Should().ContainKey(nameof(FiltersInput.Filters));
    }
}
