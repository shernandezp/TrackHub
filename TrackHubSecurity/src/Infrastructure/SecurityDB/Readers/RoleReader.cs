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

using TrackHub.Security.Infrastructure.Interfaces;

namespace TrackHub.Security.Infrastructure.Readers;

public sealed class RoleReader(IApplicationDbContext context) : IRoleReader
{
    public async Task<RoleVm> GetRoleAsync(string name, CancellationToken cancellationToken)
        => await context.Roles
            .Where(r => r.Name == name)
            .Select(r => new RoleVm(r.RoleId, r.Name))
            .FirstAsync(cancellationToken);

    // The Administrator exclusion is applied in SQL: post-fetch filtering would make any windowed
    // read ragged.
    public async Task<IReadOnlyCollection<RoleVm>> GetRolesAsync(bool includeAdministrator, CancellationToken cancellationToken)
        => await context.Roles
            .Where(r => includeAdministrator || r.Name != Common.Domain.Constants.Roles.Administrator)
            .OrderBy(r => r.Name)
            .ThenBy(r => r.RoleId)
            .Select(r => new RoleVm(r.RoleId, r.Name))
            .ToListAsync(cancellationToken);

    public async Task<RoleResourceVm> GetResourcesAsync(int roleId, CancellationToken cancellationToken)
        => await context.Roles
            .Where(r => r.RoleId == roleId)
            .Select(r => new RoleResourceVm
            {
                RoleId = r.RoleId,
                Name = r.Name,
                Resources = context.ResourceActionRole
                    .Where(rar => rar.RoleId == r.RoleId)
                    .Select(rar => rar.ResourceAction.Resource)
                    .Distinct()
                    .Select(res => new ResourceVm
                    {
                        ResourceId = res.ResourceId,
                        ResourceName = res.ResourceName,
                        Actions = context.ResourceActionRole
                            .Where(rar => rar.ResourceId == res.ResourceId && rar.RoleId == r.RoleId)
                            .Select(rar => rar.ResourceAction.Action)
                            .Select(a => new ActionVm
                            (
                                a.ActionId,
                                a.ActionName,
                                res.ResourceId
                            )).ToList()
                    }).ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);

}
