namespace TrackHub.Manager.Domain.Models;

/// <summary>What one emission did to the alert table; rules fan out only for Opened and Repeated.</summary>
public enum AlertTransition
{
    Opened,
    Repeated,
    Recovered,
    Ignored,
}

public readonly record struct AlertRecordResult(AlertEventVm Event, AlertTransition Transition)
{
    public bool NotifiesRules => Transition is AlertTransition.Opened or AlertTransition.Repeated;
}
