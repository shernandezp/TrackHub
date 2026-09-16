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

using System.Security.Claims;
using OpenIddict.Abstractions;
using TrackHub.AuthorityServer.Domain.Interfaces;

namespace TrackHub.AuthorityServer.Web.Helpers;

/// <summary>
/// Re-validates the principal behind an existing session against current security state.
/// <para>
/// Both token issuance paths need this: the refresh grant, and the authorization endpoint, which
/// mints tokens from the SSO cookie. Without the cookie check, deactivating a user, locking them
/// out or revoking a driver credential does not end the session — the browser simply runs a fresh
/// authorization-code flow and receives new tokens.
/// </para>
/// </summary>
public sealed class SubjectValidity(
    IUserReader userReader,
    IDriverCredentialReader driverCredentialReader)
{
    public async Task<bool> IsStillValidAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(principal);

        var principalType = principal.FindFirst("principal_type")?.Value ?? "User";

        if (string.Equals(principalType, "Driver", StringComparison.OrdinalIgnoreCase))
        {
            // The credential the session was issued from is what must still be active: a driver may
            // hold several, and revoking one has to end ITS sessions even while the others live on.
            if (Guid.TryParse(principal.FindFirst("driver_credential_id")?.Value, out var credentialId))
            {
                return await driverCredentialReader.IsCredentialActiveAsync(credentialId, cancellationToken);
            }

            return Guid.TryParse(principal.FindFirst("driver_id")?.Value, out var driverId)
                && await driverCredentialReader.HasActiveCredentialAsync(driverId, cancellationToken);
        }

        if (string.Equals(principalType, "ServiceClient", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var subject = principal.FindFirst("user_id")?.Value
            ?? principal.FindFirst(OpenIddictConstants.Claims.Subject)?.Value
            ?? principal.FindFirst(ClaimTypes.Sid)?.Value;

        if (!Guid.TryParse(subject, out var userId))
        {
            return false;
        }

        var user = await userReader.GetUserAsync(userId, cancellationToken);
        return user != default
            && user.Active
            && (user.LockedUntil is null || user.LockedUntil <= DateTimeOffset.UtcNow);
    }
}
