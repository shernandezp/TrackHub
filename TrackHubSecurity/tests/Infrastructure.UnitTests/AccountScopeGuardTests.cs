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

using Ardalis.GuardClauses;
using Common.Application.Exceptions;
using Common.Application.Interfaces;
using Common.Domain.Constants;
using Microsoft.EntityFrameworkCore;
using TrackHub.Security.Domain.Records;
using TrackHub.Security.Infrastructure;
using TrackHub.Security.Infrastructure.Entities;
using TrackHub.Security.Infrastructure.Readers;
using TrackHub.Security.Infrastructure.Writers;

namespace Infrastructure.UnitTests;

/// <summary>
/// Foreign-deny pins for the TS-06 by-id guards (the enforcement the
/// <c>[AccountScopeEnforcedInHandler]</c> markers on the user requests cite): a caller from one
/// account must not read, mutate, delete, or grant roles/policies against a user owned by another
/// account, while same-account callers, the Administrator, and global service identities keep
/// working. Removing a RequireAccountAccess call fails one of these.
/// </summary>
[TestFixture]
internal class AccountScopeGuardTests
{
    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    private static User NewUser(Guid accountId, string username)
        => new(username, "pw", $"{username}@mail.com", "first", null, "last", null, null, true, 0, accountId);

    private static ICurrentPrincipal Principal(PrincipalType type, Guid? accountId, string? role = null)
    {
        var principal = new Mock<ICurrentPrincipal>();
        principal.SetupGet(p => p.PrincipalType).Returns(type);
        principal.SetupGet(p => p.AccountId).Returns(accountId);
        principal.SetupGet(p => p.Role).Returns(role);
        principal.SetupGet(p => p.UserId).Returns(Guid.NewGuid());
        return principal.Object;
    }

    private static ICurrentPrincipal ForeignUser() => Principal(PrincipalType.User, Guid.NewGuid(), Roles.Manager);

    private static UpdateUserDto UpdateDtoFor(User user)
        => new(user.UserId, user.Username, user.EmailAddress, user.FirstName, user.SecondName, user.LastName, user.SecondSurname, user.DOB, true, false);

    [Test]
    public async Task Reader_GetUser_ForeignAccount_IsNotFound()
    {
        await using var context = NewContext(nameof(Reader_GetUser_ForeignAccount_IsNotFound));
        var target = NewUser(Guid.NewGuid(), "target");
        await context.Users.AddAsync(target);
        await context.SaveChangesAsync(CancellationToken.None);

        var reader = new UserReader(context, ForeignUser());

        await Assert.ThrowsAsync<NotFoundException>(() => reader.GetUserAsync(target.UserId, CancellationToken.None));
    }

    [Test]
    public async Task Reader_GetUser_SameAccount_Passes()
    {
        await using var context = NewContext(nameof(Reader_GetUser_SameAccount_Passes));
        var target = NewUser(Guid.NewGuid(), "target");
        await context.Users.AddAsync(target);
        await context.SaveChangesAsync(CancellationToken.None);

        var reader = new UserReader(context, Principal(PrincipalType.User, target.AccountId, Roles.Manager));
        var vm = await reader.GetUserAsync(target.UserId, CancellationToken.None);

        Assert.That(vm.UserId, Is.EqualTo(target.UserId));
    }

    [Test]
    public async Task Reader_GetUser_Administrator_ReadsAnyAccount()
    {
        await using var context = NewContext(nameof(Reader_GetUser_Administrator_ReadsAnyAccount));
        var target = NewUser(Guid.NewGuid(), "target");
        await context.Users.AddAsync(target);
        await context.SaveChangesAsync(CancellationToken.None);

        var reader = new UserReader(context, Principal(PrincipalType.User, Guid.NewGuid(), Roles.Administrator));
        var vm = await reader.GetUserAsync(target.UserId, CancellationToken.None);

        Assert.That(vm.UserId, Is.EqualTo(target.UserId));
    }

    [Test]
    public async Task Writer_UpdateUser_ForeignAccount_IsNotFound_AndWritesNothing()
    {
        await using var context = NewContext(nameof(Writer_UpdateUser_ForeignAccount_IsNotFound_AndWritesNothing));
        var target = NewUser(Guid.NewGuid(), "target");
        await context.Users.AddAsync(target);
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new UserWriter(context, ForeignUser());

        await Assert.ThrowsAsync<NotFoundException>(() => writer.UpdateUserAsync(
            UpdateDtoFor(target) with { Username = "hijacked" }, CancellationToken.None));
        Assert.That((await context.Users.FindAsync(target.UserId))!.Username, Is.EqualTo("target"));
    }

    [Test]
    public async Task Writer_UpdatePassword_ForeignAccount_IsNotFound()
    {
        await using var context = NewContext(nameof(Writer_UpdatePassword_ForeignAccount_IsNotFound));
        var target = NewUser(Guid.NewGuid(), "target");
        await context.Users.AddAsync(target);
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new UserWriter(context, ForeignUser());

        await Assert.ThrowsAsync<NotFoundException>(() => writer.UpdatePasswordAsync(
            new UserPasswordDto(target.UserId, "newPassword1!"), verifyCurrentPassword: false, CancellationToken.None));
    }

    [Test]
    public async Task Writer_UnlockUser_ForeignAccount_IsNotFound()
    {
        await using var context = NewContext(nameof(Writer_UnlockUser_ForeignAccount_IsNotFound));
        var target = NewUser(Guid.NewGuid(), "target");
        await context.Users.AddAsync(target);
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new UserWriter(context, ForeignUser());

        await Assert.ThrowsAsync<NotFoundException>(() => writer.UnlockUserAsync(target.UserId, CancellationToken.None));
    }

    [Test]
    public async Task Writer_DeleteUser_ForeignAccount_IsNotFound_AndRowSurvives()
    {
        await using var context = NewContext(nameof(Writer_DeleteUser_ForeignAccount_IsNotFound_AndRowSurvives));
        var target = NewUser(Guid.NewGuid(), "target");
        await context.Users.AddAsync(target);
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new UserWriter(context, ForeignUser());

        await Assert.ThrowsAsync<NotFoundException>(() => writer.DeleteUserAsync(target.UserId, CancellationToken.None));
        Assert.That(await context.Users.FindAsync(target.UserId), Is.Not.Null);
    }

    [Test]
    public async Task Writer_DeleteUser_SameAccount_Deletes()
    {
        await using var context = NewContext(nameof(Writer_DeleteUser_SameAccount_Deletes));
        var target = NewUser(Guid.NewGuid(), "target");
        await context.Users.AddAsync(target);
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new UserWriter(context, Principal(PrincipalType.User, target.AccountId, Roles.Manager));
        await writer.DeleteUserAsync(target.UserId, CancellationToken.None);

        Assert.That(await context.Users.FindAsync(target.UserId), Is.Null);
    }

    [Test]
    public async Task Writer_CreateUser_ForeignAccount_IsForbidden()
    {
        await using var context = NewContext(nameof(Writer_CreateUser_ForeignAccount_IsForbidden));
        var writer = new UserWriter(context, ForeignUser());
        var dto = new CreateUserDto("new-user", "pw", "new@mail.com", "first", null, "last", null, null, true, false);

        await Assert.ThrowsAsync<ForbiddenAccessException>(() => writer.CreateUserAsync(dto, Guid.NewGuid(), CancellationToken.None));
    }

    [Test]
    public async Task RoleWriter_Grant_ForeignAccountTarget_IsNotFound()
    {
        await using var context = NewContext(nameof(RoleWriter_Grant_ForeignAccountTarget_IsNotFound));
        var target = NewUser(Guid.NewGuid(), "target");
        await context.Users.AddAsync(target);
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new UserRoleWriter(context, ForeignUser());

        await Assert.ThrowsAsync<NotFoundException>(() => writer.CreateUserRoleAsync(
            new UserRoleDto(target.UserId, 1), CancellationToken.None));
    }

    [Test]
    public async Task PolicyWriter_Grant_ForeignAccountTarget_IsNotFound()
    {
        await using var context = NewContext(nameof(PolicyWriter_Grant_ForeignAccountTarget_IsNotFound));
        var target = NewUser(Guid.NewGuid(), "target");
        await context.Users.AddAsync(target);
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new UserPolicyWriter(context, ForeignUser());

        await Assert.ThrowsAsync<NotFoundException>(() => writer.CreateUserPolicyAsync(
            new UserPolicyDto(target.UserId, 1), CancellationToken.None));
    }

    private static async Task<(Role Administrator, Role Manager, Role User)> SeedRoleHierarchyAsync(ApplicationDbContext context)
    {
        var administrator = new Role { RoleId = 1, Name = Roles.Administrator, Description = string.Empty };
        var manager = new Role { RoleId = 2, Name = Roles.Manager, Description = string.Empty, ParentRoleId = administrator.RoleId };
        var user = new Role { RoleId = 3, Name = Roles.User, Description = string.Empty, ParentRoleId = manager.RoleId };
        await context.Roles.AddRangeAsync(administrator, manager, user);
        await context.SaveChangesAsync(CancellationToken.None);
        return (administrator, manager, user);
    }

    [Test]
    public async Task RoleWriter_Manager_CannotGrantAdministrator()
    {
        await using var context = NewContext(nameof(RoleWriter_Manager_CannotGrantAdministrator));
        var accountId = Guid.NewGuid();
        var target = NewUser(accountId, "target");
        await context.Users.AddAsync(target);
        var (administrator, _, _) = await SeedRoleHierarchyAsync(context);

        var writer = new UserRoleWriter(context, Principal(PrincipalType.User, accountId, Roles.Manager));

        await Assert.ThrowsAsync<ForbiddenAccessException>(() => writer.CreateUserRoleAsync(
            new UserRoleDto(target.UserId, administrator.RoleId), CancellationToken.None));
    }

    [Test]
    public async Task RoleWriter_Manager_CanGrantASubordinateRole()
    {
        await using var context = NewContext(nameof(RoleWriter_Manager_CanGrantASubordinateRole));
        var accountId = Guid.NewGuid();
        var target = NewUser(accountId, "target");
        await context.Users.AddAsync(target);
        var (_, _, user) = await SeedRoleHierarchyAsync(context);

        var writer = new UserRoleWriter(context, Principal(PrincipalType.User, accountId, Roles.Manager));
        var granted = await writer.CreateUserRoleAsync(new UserRoleDto(target.UserId, user.RoleId), CancellationToken.None);

        Assert.That(granted.RoleId, Is.EqualTo(user.RoleId));
    }

    [TestCase(Roles.Manager)]
    [TestCase(Roles.Administrator)]
    public async Task Writer_Manager_CannotDeleteAPeerOrAnAdministrator(string subjectRole)
    {
        await using var context = NewContext(nameof(Writer_Manager_CannotDeleteAPeerOrAnAdministrator) + subjectRole);
        var accountId = Guid.NewGuid();
        var target = NewUser(accountId, "target");
        await context.Users.AddAsync(target);
        var (administrator, manager, _) = await SeedRoleHierarchyAsync(context);
        await context.UserRoles.AddAsync(new UserRole { UserId = target.UserId, RoleId = subjectRole == Roles.Manager ? manager.RoleId : administrator.RoleId });
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new UserWriter(context, Principal(PrincipalType.User, accountId, Roles.Manager));

        await Assert.ThrowsAsync<ForbiddenAccessException>(() => writer.DeleteUserAsync(target.UserId, CancellationToken.None));
        Assert.That(await context.Users.FindAsync(target.UserId), Is.Not.Null);
    }

    [Test]
    public async Task RoleWriter_Administrator_CanGrantAdministrator()
    {
        await using var context = NewContext(nameof(RoleWriter_Administrator_CanGrantAdministrator));
        var accountId = Guid.NewGuid();
        var target = NewUser(accountId, "target");
        await context.Users.AddAsync(target);
        var (administrator, _, _) = await SeedRoleHierarchyAsync(context);

        var writer = new UserRoleWriter(context, Principal(PrincipalType.User, accountId, Roles.Administrator));
        var granted = await writer.CreateUserRoleAsync(new UserRoleDto(target.UserId, administrator.RoleId), CancellationToken.None);

        Assert.That(granted.RoleId, Is.EqualTo(administrator.RoleId));
    }

    [Test]
    public async Task PolicyWriter_Manager_CannotGrantAPolicyCarryingUnheldResourceActions()
    {
        await using var context = NewContext(nameof(PolicyWriter_Manager_CannotGrantAPolicyCarryingUnheldResourceActions));
        var accountId = Guid.NewGuid();
        var target = NewUser(accountId, "target");
        await context.Users.AddAsync(target);
        await SeedRoleHierarchyAsync(context);
        await context.ResourceActionPolicy.AddAsync(new ResourceActionPolicy { ResourceActionPolicyId = 1, PolicyId = 7, ResourceId = 42, ActionId = 1 });
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new UserPolicyWriter(context, Principal(PrincipalType.User, accountId, Roles.Manager));

        await Assert.ThrowsAsync<ForbiddenAccessException>(() => writer.CreateUserPolicyAsync(
            new UserPolicyDto(target.UserId, 7), CancellationToken.None));
    }

    [Test]
    public async Task PolicyWriter_Administrator_CannotGrantThePlatformOperatorPolicy()
    {
        await using var context = NewContext(nameof(PolicyWriter_Administrator_CannotGrantThePlatformOperatorPolicy));
        var accountId = Guid.NewGuid();
        var target = NewUser(accountId, "target");
        await context.Users.AddAsync(target);
        var (administrator, _, _) = await SeedRoleHierarchyAsync(context);
        await context.ResourceActionPolicy.AddAsync(new ResourceActionPolicy { ResourceActionPolicyId = 1, PolicyId = 9, ResourceId = 77, ActionId = 1 });
        await context.ResourceActionRole.AddAsync(new ResourceActionRole { ResourceActionRoleId = 1, RoleId = administrator.RoleId, ResourceId = 5, ActionId = 1 });
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new UserPolicyWriter(context, Principal(PrincipalType.User, accountId, Roles.Administrator));

        await Assert.ThrowsAsync<ForbiddenAccessException>(() => writer.CreateUserPolicyAsync(
            new UserPolicyDto(target.UserId, 9), CancellationToken.None));
    }

    [Test]
    public async Task PolicyWriter_Manager_CanGrantAPolicyWithinItsOwnResourceActions()
    {
        await using var context = NewContext(nameof(PolicyWriter_Manager_CanGrantAPolicyWithinItsOwnResourceActions));
        var accountId = Guid.NewGuid();
        var target = NewUser(accountId, "target");
        await context.Users.AddAsync(target);
        var (_, manager, _) = await SeedRoleHierarchyAsync(context);
        await context.ResourceActionPolicy.AddAsync(new ResourceActionPolicy { ResourceActionPolicyId = 1, PolicyId = 7, ResourceId = 42, ActionId = 1 });
        await context.ResourceActionRole.AddAsync(new ResourceActionRole { ResourceActionRoleId = 1, RoleId = manager.RoleId, ResourceId = 42, ActionId = 1 });
        await context.SaveChangesAsync(CancellationToken.None);

        var writer = new UserPolicyWriter(context, Principal(PrincipalType.User, accountId, Roles.Manager));
        var granted = await writer.CreateUserPolicyAsync(new UserPolicyDto(target.UserId, 7), CancellationToken.None);

        Assert.That(granted.PolicyId, Is.EqualTo(7));
    }
}
