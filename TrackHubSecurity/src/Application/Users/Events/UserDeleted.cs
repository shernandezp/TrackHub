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
using TrackHub.Security.Domain.Constants;

namespace TrackHub.Security.Application.Users.Events;

public sealed class UserDeleted
{
    public readonly record struct Notification(Guid Id) : INotification
    {
        public class EventHandler(IOutboxWriter outbox) : INotificationHandler<Notification>
        {
            public async Task Handle(Notification notification, CancellationToken cancellationToken)
                => await outbox.EnqueueAsync(
                    OutboxMessageTypes.UserDeleted,
                    JsonSerializer.Serialize(notification.Id),
                    notification.Id.ToString(),
                    cancellationToken);
        }
    }
}
