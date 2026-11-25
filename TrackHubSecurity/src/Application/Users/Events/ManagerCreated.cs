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

namespace TrackHub.Security.Application.Users.Events;
using Common.Domain.Constants;

public sealed class ManagerCreated
{
    public readonly record struct Notification(Guid UserId) : INotification
    {
        public class EventHandler(IUserRoleWriter writer, IRoleReader roleReader) : INotificationHandler<Notification>
        {
            public async Task Handle(Notification notification, CancellationToken cancellationToken)
            {
                var role = await roleReader.GetRoleAsync(Roles.Manager, cancellationToken);
                await writer.CreateUserRoleAsync(new UserRoleDto(
                    notification.UserId,
                    role.RoleId
                    ), cancellationToken);
            }
        }
    }
}
