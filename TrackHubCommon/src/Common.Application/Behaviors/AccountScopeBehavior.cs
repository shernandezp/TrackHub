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

using System.Collections.Concurrent;
using System.Reflection;
using Common.Application.Attributes;
using Common.Application.Exceptions;
using Common.Application.Interfaces;
using Common.Mediator;
using Microsoft.Extensions.Logging;

namespace Common.Application.Behaviors;

/// <summary>
/// Central tenant-scope guard, run right after <see cref="AuthorizationBehavior{TRequest, TResponse}"/>.
/// A request naming an account must match the principal's unless marked <see cref="AllowCrossAccountAttribute"/>.
/// A request naming none passes on <see cref="AllowCrossAccountAttribute"/> or <see cref="PlatformScopedAttribute"/>;
/// otherwise the handler scopes to the caller's account, so a principal with no account is denied, even
/// for <see cref="AccountScopeEnforcedInHandlerAttribute"/> requests (the handler needs an account to check against).
/// </summary>
public sealed class AccountScopeBehavior<TRequest, TResponse>(
    ICurrentPrincipal principal,
    ILogger<AccountScopeBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse> where TRequest : notnull
{
    private static readonly ConcurrentDictionary<Type, AllowCrossAccountAttribute?> CrossAccountCache = new();
    private static readonly ConcurrentDictionary<Type, PlatformScopedAttribute?> PlatformScopedCache = new();
    private static readonly ConcurrentDictionary<Type, bool> ScopeEnforcedInHandlerCache = new();

    public async Task<TResponse> HandleAsync(TRequest request, Func<Task<TResponse>> next, CancellationToken cancellationToken)
    {
        var requestAccountId = RequestAccountResolver.GetRequestAccountId(request);
        if (requestAccountId is not null)
        {
            var crossAccount = IsCrossAccount(typeof(TRequest));
            if (crossAccount is not null)
            {
                logger.LogDebug(
                    "Cross-account call permitted for {RequestType} targeting account {AccountId} by principal {PrincipalType} (account {PrincipalAccountId}). Justification: {Justification}",
                    typeof(TRequest).FullName,
                    requestAccountId.Value,
                    principal.PrincipalType,
                    principal.AccountId,
                    crossAccount.Justification);
                return await next();
            }

            if (principal.AccountId is not { } principalAccountId || principalAccountId == Guid.Empty)
            {
                logger.LogWarning(
                    "Tenant scope denied for {RequestType}: the request targets account {AccountId} but principal {PrincipalType} ('{SubjectId}') carries no account scope.",
                    typeof(TRequest).FullName,
                    requestAccountId.Value,
                    principal.PrincipalType,
                    principal.ClientId ?? principal.SubjectId);
                throw new ForbiddenAccessException(
                    "Insufficient permissions. The caller has no account scope and may not act on a specific account.");
            }

            if (principalAccountId != requestAccountId.Value)
            {
                logger.LogWarning(
                    "Tenant scope denied for {RequestType}: principal {PrincipalType} ('{SubjectId}') of account {PrincipalAccountId} targeted account {AccountId}.",
                    typeof(TRequest).FullName,
                    principal.PrincipalType,
                    principal.ClientId ?? principal.SubjectId,
                    principalAccountId,
                    requestAccountId.Value);
                throw new ForbiddenAccessException(
                    "Insufficient permissions. The requested account is outside the caller's account scope.");
            }

            return await next();
        }

        // No account in the request: a declared pass-through marker passes.
        if (IsCrossAccount(typeof(TRequest)) is not null)     // service-identity cross-tenant surface
        {
            return await next();
        }

        if (IsPlatformScoped(typeof(TRequest)) is { } platformScoped)  // platform-owned data, identical for every tenant
        {
            logger.LogDebug(
                "Platform-scoped request {RequestType} passed for principal {PrincipalType} (account {PrincipalAccountId}). Justification: {Justification}",
                typeof(TRequest).FullName,
                principal.PrincipalType,
                principal.AccountId,
                platformScoped.Justification);
            return await next();
        }

        // Otherwise the handler scopes to the principal's own account, so a principal without one is denied;
        // [AccountScopeEnforcedInHandler] lands here too, as its ownership check still needs a caller account.
        if (principal.AccountId is { } callerAccountId && callerAccountId != Guid.Empty)
        {
            return await next();
        }

        var enforcedInHandler = IsScopeEnforcedInHandler(typeof(TRequest));
        logger.LogWarning(
            "Tenant scope denied for {RequestType}: the request names no account and principal {PrincipalType} " +
            "('{SubjectId}') has no account scope to derive it from.{HandlerEnforcedHint}",
            typeof(TRequest).FullName,
            principal.PrincipalType,
            principal.ClientId ?? principal.SubjectId,
            enforcedInHandler
                ? " [AccountScopeEnforcedInHandler] does not admit account-less principals — the handler's " +
                  "ownership check needs a caller account to check against; a service identity that must reach " +
                  "this data needs a dedicated [AllowCrossAccount] request."
                : string.Empty);
        throw new ForbiddenAccessException(
            "Insufficient permissions. The request names no account and the caller carries no account scope.");
    }

    private static AllowCrossAccountAttribute? IsCrossAccount(Type requestType)
        => CrossAccountCache.GetOrAdd(requestType, static t =>
            t.GetCustomAttribute<AllowCrossAccountAttribute>(inherit: true));

    private static PlatformScopedAttribute? IsPlatformScoped(Type requestType)
        => PlatformScopedCache.GetOrAdd(requestType, static t =>
            t.GetCustomAttribute<PlatformScopedAttribute>(inherit: true));

    private static bool IsScopeEnforcedInHandler(Type requestType)
        => ScopeEnforcedInHandlerCache.GetOrAdd(requestType, static t =>
            t.GetCustomAttribute<AccountScopeEnforcedInHandlerAttribute>(inherit: true) is not null);
}
