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

using Common.Domain.Constants;
using TrackHub.Security.Application.UserRole.Commands.Create;
using TrackHub.Security.Application.Users.Events;

namespace Application.UnitTests.UserRole;

// Manager's user replica carries the effective role, so every role change re-mirrors the user.
[TestFixture]
public class UserRoleMirrorTests
{
    private static UserVm User(Guid userId, params RoleVm[] roles)
        => new(userId, "alice", "alice@mail.com", "Alice", null, "Doe", null, null, 0, null, Guid.NewGuid(), true, false, roles, []);

    [Test]
    public void EffectiveRole_IsTheMostPrivilegedBySeededOrder()
    {
        var roles = new[] { new RoleVm(3, Roles.User), new RoleVm(2, Roles.Manager) };

        Assert.Multiple(() =>
        {
            Assert.That(UserUpdated.EffectiveRole(roles), Is.EqualTo(Roles.Manager));
            Assert.That(UserUpdated.EffectiveRole([]), Is.Null);
            Assert.That(UserUpdated.EffectiveRole(null), Is.Null);
        });
    }

    [Test]
    public async Task AssigningARole_MirrorsTheUserWithItsNewEffectiveRole()
    {
        var userId = Guid.NewGuid();
        var reader = new Mock<IUserReader>();
        reader.Setup(r => r.GetUserAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(User(userId, new RoleVm(2, Roles.Manager), new RoleVm(3, Roles.User)));
        var publisher = new Mock<IPublisher>();
        var writer = new Mock<IUserRoleWriter>();
        writer.Setup(w => w.CreateUserRoleAsync(It.IsAny<UserRoleDto>(), It.IsAny<CancellationToken>())).ReturnsAsync(new UserRoleVm(userId, 2));

        await new CreateUserRoleCommandHandler(writer.Object, reader.Object, publisher.Object, Mock.Of<Common.Application.Interfaces.ICurrentPrincipal>())
            .Handle(new CreateUserRoleCommand(new UserRoleDto(userId, 2)), CancellationToken.None);

        publisher.Verify(p => p.Publish(
            It.Is<UserUpdated.Notification>(n => n.Id == userId && n.User.Role == Roles.Manager && n.User.Active),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
