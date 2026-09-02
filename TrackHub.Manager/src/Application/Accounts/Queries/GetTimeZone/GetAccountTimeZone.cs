/**
 * Copyright (c) 2025 Sergio Hernandez. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

namespace TrackHub.Manager.Application.Accounts.Queries.GetTimeZone;

/// <summary>
/// The IANA zone an account keeps its calendar in. Every other service asks this on behalf of the
/// account it is serving, so it sits behind the same <c>AccountFeatures/Read</c> permission those
/// services already hold for their feature flags rather than the account master surface.
/// </summary>
[Authorize(Resource = Resources.AccountFeatures, Action = Actions.Read)]
// Enforcement: the reader checks the requested account against the caller's scope (RequireAccountAccess).
[AccountScopeEnforcedInHandler]
public readonly record struct GetAccountTimeZoneQuery(Guid AccountId) : IRequest<string>;

public class GetAccountTimeZoneQueryHandler(IAccountReader reader) : IRequestHandler<GetAccountTimeZoneQuery, string>
{
    public async Task<string> Handle(GetAccountTimeZoneQuery request, CancellationToken cancellationToken)
        => await reader.GetTimeZoneAsync(request.AccountId, cancellationToken);
}
