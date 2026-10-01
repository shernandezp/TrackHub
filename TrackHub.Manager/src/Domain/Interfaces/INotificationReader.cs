namespace TrackHub.Manager.Domain.Interfaces;

public interface INotificationReader
{
    Task<NotificationRulesPageVm> GetNotificationRulesAsync(Guid accountId, int skip, int take, CancellationToken cancellationToken);
    Task<NotificationDeliveriesPageVm> GetNotificationDeliveriesAsync(Guid accountId, string? status, string? channel, DateTimeOffset? from, DateTimeOffset? to, int skip, int take, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<MyNotificationVm>> GetMyNotificationsAsync(bool unreadOnly, int skip, int take, CancellationToken cancellationToken);
    Task<IReadOnlyCollection<DeliveryHealthVm>> GetDeliveryHealthAsync(Guid accountId, DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken);
}
