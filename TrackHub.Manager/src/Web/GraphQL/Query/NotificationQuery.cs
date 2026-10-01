using TrackHub.Manager.Application.Notifications.Queries;

namespace TrackHub.Manager.Web.GraphQL.Query;

public partial class Query
{
    public async Task<NotificationRulesPageVm> GetNotificationRules([Service] ISender sender, [AsParameters] GetNotificationRulesQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);
    public async Task<NotificationDeliveriesPageVm> GetNotificationDeliveries([Service] ISender sender, [AsParameters] GetNotificationDeliveriesQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);
    public async Task<AlertSubscriptionsPageVm> GetAlertSubscriptions([Service] ISender sender, [AsParameters] GetAlertSubscriptionsQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);
    public async Task<IReadOnlyCollection<NotificationTemplateVm>> GetNotificationTemplates([Service] ISender sender, [AsParameters] GetNotificationTemplatesQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);
    public async Task<IReadOnlyCollection<MyNotificationVm>> GetMyNotifications([Service] ISender sender, [AsParameters] GetMyNotificationsQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);
    public async Task<IReadOnlyCollection<DeliveryHealthVm>> GetDeliveryHealth([Service] ISender sender, [AsParameters] GetDeliveryHealthQuery query, CancellationToken cancellationToken) => await sender.Send(query, cancellationToken);
}
