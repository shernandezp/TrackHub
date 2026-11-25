namespace TrackHub.Manager.Domain.Interfaces;

/// <summary>
/// Never throws for per-rule failures: evaluation is non-blocking for the originating command.
/// </summary>
public interface IAlertRuleEvaluator
{
    /// <returns>The number of deliveries created.</returns>
    Task<int> EvaluateAsync(AlertEventVm alertEvent, CancellationToken cancellationToken);
}
