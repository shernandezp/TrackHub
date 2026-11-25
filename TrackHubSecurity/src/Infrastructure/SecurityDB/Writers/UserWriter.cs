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

using Common.Application.Exceptions;
using Common.Application.Interfaces;
using Common.Domain.Extensions;
using TrackHub.Security.Domain.Records;
using TrackHub.Security.Infrastructure.Interfaces;

namespace TrackHub.Security.Infrastructure.Writers;

// Every by-id mutation loads the row first and checks its owning account against the caller
// (RequireAccountAccess) — the enforcement point the [AccountScopeEnforcedInHandler] markers on
// the user commands cite.
public sealed class UserWriter(IApplicationDbContext context, ICurrentPrincipal principal)
    : AccountScopedDataAccess(context, principal), IUserWriter
{
    public async Task<UserVm> CreateUserAsync(CreateUserDto userDto, Guid accountId, CancellationToken cancellationToken)
    {
        await RequireAccountAccessAsync(accountId, cancellationToken);

        var password = userDto.Password.HashPassword();

        var user = new User(
            userDto.Username,
            password,
            userDto.EmailAddress,
            userDto.FirstName,
            userDto.SecondName,
            userDto.LastName,
            userDto.SecondSurname,
            userDto.DOB,
            userDto.Active,
            0,
            accountId,
            userDto.IntegrationUser);

        // Sign-in is refused while `verified` is null, and the platform has no self-registration.
        user.Verified = DateTimeOffset.UtcNow;

        await Context.Users.AddAsync(user, cancellationToken);

        await Context.SaveChangesAsync(cancellationToken);

        return new UserVm(
            user.UserId,
            user.Username,
            user.EmailAddress,
            user.FirstName,
            user.SecondName,
            user.LastName,
            user.SecondSurname,
            user.DOB,
            user.LoginAttempts,
            user.LockedUntil,
            user.AccountId,
            user.Active,
            user.IntegrationUser,
            [],
            []);
    }

    public async Task UpdateUserAsync(UpdateUserDto userDto, CancellationToken cancellationToken)
    {
        var user = await RequireUserForChangeAsync(userDto.UserId, cancellationToken);

        Context.Users.Attach(user);

        user.Username = userDto.Username;
        user.EmailAddress = userDto.EmailAddress;
        user.FirstName = userDto.FirstName;
        user.SecondName = userDto.SecondName;
        user.LastName = userDto.LastName;
        user.SecondSurname = userDto.SecondSurname;
        user.DOB = userDto.DOB;
        if (user.Active && !userDto.Active)
        {
            user.SecurityStamp = Guid.NewGuid();
        }
        user.Active = userDto.Active;
        user.IntegrationUser = userDto.IntegrationUser;
        user.LoginAttempts = 0;

        await Context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateUserAsync(UpdateCurrentUserDto userDto, Guid userId, CancellationToken cancellationToken)
    {
        var user = await RequireUserForChangeAsync(userId, cancellationToken);

        Context.Users.Attach(user);

        user.FirstName = userDto.FirstName;
        user.SecondName = userDto.SecondName;
        user.LastName = userDto.LastName;
        user.SecondSurname = userDto.SecondSurname;
        user.DOB = userDto.DOB;

        await Context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdatePasswordAsync(UserPasswordDto userPasswordDto, bool verifyCurrentPassword, CancellationToken cancellationToken)
    {
        var user = await RequireUserForChangeAsync(userPasswordDto.UserId, cancellationToken);

        // A self-service change proves knowledge of the existing password, so a live access token
        // or an unattended session cannot take the account over permanently.
        if (verifyCurrentPassword
            && (string.IsNullOrEmpty(userPasswordDto.CurrentPassword)
                || !user.Password.VerifyHashedPassword(userPasswordDto.CurrentPassword)))
        {
            throw new ForbiddenAccessException("The current password is incorrect.");
        }

        Context.Users.Attach(user);

        var password = userPasswordDto.Password.HashPassword();

        user.Password = password;
        user.SecurityStamp = Guid.NewGuid();

        await Context.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Clears an account lockout: resets the rolling failed-attempt counter and any timed lock so the
    /// user can sign in immediately. Mirrors the reset the AuthorityServer performs on a successful login.
    /// </summary>
    public async Task UnlockUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await RequireUserForChangeAsync(userId, cancellationToken);

        Context.Users.Attach(user);
        user.LoginAttempts = 0;
        user.LockedUntil = null;

        await Context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await RequireUserForChangeAsync(userId, cancellationToken);

        Context.Users.Attach(user);
        Context.Users.Remove(user);

        await Context.SaveChangesAsync(cancellationToken);
    }
}
