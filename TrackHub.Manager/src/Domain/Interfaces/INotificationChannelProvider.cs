namespace TrackHub.Manager.Domain.Interfaces;

public interface INotificationChannelProvider
{
    /// <summary>One of <c>NotificationChannels</c>.</summary>
    string Channel { get; }

    Task<NotificationSendResult> SendAsync(NotificationMessage message, CancellationToken cancellationToken);
}
