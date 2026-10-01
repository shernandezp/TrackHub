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

using TrackHub.Manager.Application.Lookups;

namespace TrackHub.Manager.Application.Transporters.Queries.GetByGroup;

// The live map narrows to a group server-side; the whole membership is needed, so it is unpaged.
[Authorize(Resource = Resources.Transporters, Action = Actions.Read)]
// Enforcement: TransporterReader resolves the group's account and the caller's group membership.
[AccountScopeEnforcedInHandler]
public readonly record struct GetTransporterIdsByGroupQuery(long GroupId) : IRequest<IReadOnlyCollection<Guid>>;

public class GetTransporterIdsByGroupQueryHandler(ITransporterReader reader) : IRequestHandler<GetTransporterIdsByGroupQuery, IReadOnlyCollection<Guid>>
{
    public async Task<IReadOnlyCollection<Guid>> Handle(GetTransporterIdsByGroupQuery request, CancellationToken cancellationToken)
        => UnpagedReadLimits.EnsureWithinCeiling(
            await reader.GetTransporterIdsByGroupAsync(request.GroupId, UnpagedReadLimits.Ceiling + 1, cancellationToken),
            "transporterIdsByGroup");
}
