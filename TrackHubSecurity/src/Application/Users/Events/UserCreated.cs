// Copyright (c) 2026 Sergio Hernandez. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License").
//  You may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

using System.Text.Json;
using TrackHub.Security.Application.Outbox;
using TrackHub.Security.Domain.Constants;

namespace TrackHub.Security.Application.Users.Events;

public sealed class UserCreated
{
    public readonly record struct Notification(UserShrankDto User) : INotification
    {
        // Recorded rather than called: the Security user row is already committed, so a Manager
        // outage here would otherwise leave a user with no replica and no trace of the debt.
        public class EventHandler(IOutboxWriter outbox) : INotificationHandler<Notification>
        {
            public async Task Handle(Notification notification, CancellationToken cancellationToken)
                => await outbox.EnqueueAsync(
                    OutboxMessageTypes.UserCreated,
                    JsonSerializer.Serialize(notification.User),
                    notification.User.UserId.ToString(),
                    cancellationToken);
        }
    }
}
