// Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

public sealed class UserUpdated
{
    public readonly record struct Notification(Guid Id, UpdateUserShrankDto User) : INotification
    {
        public class EventHandler(IOutboxWriter outbox) : INotificationHandler<Notification>
        {
            public async Task Handle(Notification notification, CancellationToken cancellationToken)
                => await outbox.EnqueueAsync(
                    OutboxMessageTypes.UserUpdated,
                    JsonSerializer.Serialize(new UserMirrorUpdate(notification.Id, notification.User)),
                    notification.Id.ToString(),
                    cancellationToken);
        }
    }

    // The role Manager's replica carries: the most privileged one, by the seeded hierarchy order
    // (Administrator < Manager < User by id), which is also the rule the AuthorityServer stamps into
    // the access token.
    public static string? EffectiveRole(IReadOnlyCollection<RoleVm>? roles)
        => roles is { Count: > 0 } ? roles.MinBy(r => r.RoleId).Name : null;

    public static Notification Mirror(UserVm user)
        => new(user.UserId, new UpdateUserShrankDto(user.UserId, user.Username, user.Active, EffectiveRole(user.Roles), user.AccountId));
}
