namespace TrackHub.Manager.Domain.Interfaces;

public interface IAlertSubscriptionReader
{
    Task<AlertSubscriptionsPageVm> GetAlertSubscriptionsAsync(Guid accountId, Guid? principalId, int skip, int take, CancellationToken cancellationToken);
}
