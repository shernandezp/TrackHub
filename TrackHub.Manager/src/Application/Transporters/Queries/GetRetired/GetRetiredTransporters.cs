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

using Common.Application.Interfaces;
using Common.Application.Paging;

namespace TrackHub.Manager.Application.Transporters.Queries.GetRetired;

// Retired units are listed only to whoever may retire and restore them.
[Authorize(Resource = Resources.Transporters, Action = Actions.Delete)]
public readonly record struct GetRetiredTransportersQuery(int? Skip, int? Take, string? Search) : IRequest<TransportersPageVm>;

public class GetRetiredTransportersQueryHandler(ITransporterReader reader, IUserReader userReader, IUser user) : IRequestHandler<GetRetiredTransportersQuery, TransportersPageVm>
{
    public async Task<TransportersPageVm> Handle(GetRetiredTransportersQuery request, CancellationToken cancellationToken)
    {
        var userId = Guid.TryParse(user.Id, out var id) ? id : throw new UnauthorizedAccessException();
        var caller = await userReader.GetUserAsync(userId, cancellationToken);
        var (skip, take) = PageRequest.Clamp(request.Skip, request.Take);
        return await reader.GetRetiredTransportersAsync(caller.AccountId, skip, take, request.Search, cancellationToken);
    }
}
