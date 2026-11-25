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

using Common.Application.Interfaces;
using Common.Application.Paging;

namespace TrackHub.Security.Application.Users.Queries.GetByAccount;

[Authorize(Resource = Resources.Users, Action = Actions.Read)]
public readonly record struct GetUsersByAccountQuery(
    int? Skip = null,
    int? Take = null,
    string? Search = null) : IRequest<UsersPageVm>;

public class GetUsersByAccountQueryHandler(IUserReader reader, IUser user) : IRequestHandler<GetUsersByAccountQuery, UsersPageVm>
{
    private Guid UserId { get; } = Guid.TryParse(user.Id, out var userId) ? userId : throw new UnauthorizedAccessException();

    public async Task<UsersPageVm> Handle(GetUsersByAccountQuery request, CancellationToken cancellationToken)
    {
        var user = await reader.GetUserAsync(UserId, cancellationToken);
        var (skip, take) = PageRequest.Clamp(request.Skip, request.Take);
        return await reader.GetUsersAsync(user.AccountId, skip, take, request.Search, cancellationToken);
    }

}
