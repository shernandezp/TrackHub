using Common.Domain.Entities;
using FluentAssertions;

namespace Common.Domain.Tests.Entities;

public class BaseEventTests
{
    private class TestEvent : BaseEvent { }

    [Fact]
    public void BaseEvent_ImplementsINotification()
    {
        var evt = new TestEvent();
        evt.Should().BeAssignableTo<Common.Mediator.INotification>();
    }
}
