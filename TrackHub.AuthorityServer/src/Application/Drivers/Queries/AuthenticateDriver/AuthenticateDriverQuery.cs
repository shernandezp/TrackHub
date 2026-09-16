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

using System.Security.Authentication;
using Common.Domain.Extensions;
using TrackHub.AuthorityServer.Domain.Interfaces;

namespace TrackHub.AuthorityServer.Application.Drivers.Queries.AuthenticateDriver;

public readonly record struct AuthenticateDriverQuery(string Login, string Password) : IRequest<AuthenticatedDriverVm>;

/// <summary>
/// Carries the credential that authenticated, not just the driver: a driver may hold several
/// credentials, and revoking one has to invalidate the sessions issued from THAT one.
/// </summary>
public readonly record struct AuthenticatedDriverVm(Guid DriverId, Guid AccountId, Guid DriverCredentialId);

public sealed class AuthenticateDriverQueryHandler(IDriverCredentialReader reader, IDriverCredentialWriter writer) : IRequestHandler<AuthenticateDriverQuery, AuthenticatedDriverVm>
{
    private const int MaximumFailedAttempts = 5;
    private static readonly TimeSpan LockoutDuration = TimeSpan.FromMinutes(15);

    public async Task<AuthenticatedDriverVm> Handle(AuthenticateDriverQuery request, CancellationToken cancellationToken)
    {
        var normalizedLogin = request.Login.Trim().ToUpperInvariant();
        var credential = await reader.GetDriverCredentialByLoginAsync(normalizedLogin, cancellationToken);

        if (credential == null)
        {
            throw new AuthenticationException("Driver credential is incorrect");
        }

        if (!credential.Active)
        {
            throw new AuthenticationException("Driver credential is inactive");
        }

        if (credential.VerifiedAt == null || credential.ResetRequired)
        {
            throw new AuthenticationException("Driver credential activation is required");
        }

        var now = DateTimeOffset.UtcNow;
        var lockExpired = credential.LockedUntil.HasValue && credential.LockedUntil.Value <= now;

        if (credential.LockedUntil.HasValue && credential.LockedUntil.Value > now)
        {
            throw new AuthenticationException("Driver credential is locked");
        }

        if (!credential.PasswordHash.VerifyHashedPassword(request.Password))
        {
            // An expired lock resets the counter: it used to survive, so after the first lockout a
            // single wrong password re-locked the credential for another window, indefinitely.
            var failedAttempts = (lockExpired ? 0 : credential.FailedAttempts) + 1;
            DateTimeOffset? lockedUntil = failedAttempts >= MaximumFailedAttempts ? now.Add(LockoutDuration) : null;
            await writer.RecordDriverCredentialLoginFailureAsync(credential.DriverCredentialId, failedAttempts, lockedUntil, cancellationToken);
            throw new AuthenticationException("Driver credential is incorrect");
        }

        await writer.RecordDriverCredentialLoginSuccessAsync(credential.DriverCredentialId, cancellationToken);
        return new AuthenticatedDriverVm(credential.DriverId, credential.AccountId, credential.DriverCredentialId);
    }
}
