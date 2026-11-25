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

using System.Reflection;
using Common.Application.Attributes;
using Common.Application.Exceptions;
using Common.Application.Interfaces;
using Common.Mediator;

namespace Common.Application.Behaviors;

public class AuthorizationBehavior<TRequest, TResponse>(
    IUser user,
    IIdentityService identityService) : IPipelineBehavior<TRequest, TResponse> where TRequest : notnull
{
    public async Task<TResponse> HandleAsync(TRequest request, Func<Task<TResponse>> next, CancellationToken cancellationToken)
    {
        var authorizeAttributes = request.GetType().GetCustomAttributes<AuthorizeAttribute>();

        if (authorizeAttributes.Any())
        {
            if (user.Id == null)
            {
                throw new UnauthorizedAccessException();
            }

            var principalType = ResolveEffectivePrincipalType();
            foreach (var attribute in authorizeAttributes)
                if (!IsPrincipalAllowed(principalType, attribute.PrincipalTypes))
                    throw new ForbiddenAccessException(
                        attribute.Resource,
                        attribute.Action,
                        $"Principal type '{principalType}' is not allowed. Allowed principal types: {attribute.PrincipalTypes}.");

            switch (principalType)
            {
                case PrincipalType.ServiceClient:
                    foreach (var attribute in authorizeAttributes)
                        if (!await identityService.IsValidServiceAsync(user.Client ?? user.SubjectId, attribute.Resource, attribute.Action, user.AccountId, user.Scopes, user.Audiences, cancellationToken))
                            throw new ForbiddenAccessException(attribute.Resource, attribute.Action);
                    break;

                case PrincipalType.Staff:
                    // A staff principal is authorized by principal type and claims only; assignment-level checks
                    // are the handler's responsibility, and staff never carry roles or policies.
                    if (user.StaffId is not { } staffId || staffId == Guid.Empty
                        || user.AccountId is not { } staffAccountId || staffAccountId == Guid.Empty)
                    {
                        var attribute = authorizeAttributes.First();
                        throw new ForbiddenAccessException(
                            attribute.Resource,
                            attribute.Action,
                            "Staff principal requires staff_id and account_id claims.");
                    }
                    break;

                case PrincipalType.PublicLink:
                    // Public-link data access flows exclusively through Manager's anonymous resolution endpoint.
                    {
                        var attribute = authorizeAttributes.First();
                        throw new ForbiddenAccessException(
                            attribute.Resource,
                            attribute.Action,
                            "Public-link principals are not permitted to invoke authorized operations.");
                    }

                default:
                    if (!Guid.TryParse(user.Id, out var userId))
                    {
                        throw new UnauthorizedAccessException();
                    }

                    foreach (var attribute in authorizeAttributes)
                    {
                        var resource = attribute.Resource;
                        var action = attribute.Action;

                        // Single combined role + policy decision, evaluated by Security in one call.
                        if (!await identityService.AuthorizeUserAsync(userId, resource, action, cancellationToken))
                        {
                            throw new ForbiddenAccessException(resource, action);
                        }
                    }
                    break;
            }
        }

        return await next();
    }

    private PrincipalType ResolveEffectivePrincipalType()
    {
        if (user.PrincipalType != PrincipalType.Unknown)
        {
            return user.PrincipalType;
        }

        if (!string.IsNullOrEmpty(user.Role) && user.Role == "service")
        {
            return PrincipalType.ServiceClient;
        }

        return user.Id == null ? PrincipalType.Unknown : PrincipalType.User;
    }

    private static bool IsPrincipalAllowed(PrincipalType principalType, string principalTypes)
    {
        if (string.IsNullOrWhiteSpace(principalTypes))
        {
            return true;
        }

        return principalTypes
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Any(value => Enum.TryParse<PrincipalType>(value, ignoreCase: true, out var allowed) && allowed == principalType);
    }

}
