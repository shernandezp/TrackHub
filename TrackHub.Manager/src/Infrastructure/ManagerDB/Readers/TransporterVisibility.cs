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

using Common.Domain.Constants;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Readers;

/// <summary>
/// The one transporter-visibility predicate: Administrator and Manager roles read the whole
/// account, everyone else the transporters of the active groups they belong to. Retired units stay
/// visible (their history is kept); current-state reads add the <c>RetiredAt</c> filter themselves. Privilege for the
/// calling user comes from the token; for any other user it comes from the role Security replicates
/// onto <c>app.users</c>, which is what lets background work (alert fan-out) answer for a subscriber.
/// </summary>
internal static class TransporterVisibility
{
    public static bool IsPrivilegedRole(string? role)
        => PrivilegedRoles.Contains(role, StringComparer.OrdinalIgnoreCase);

    public static readonly string[] PrivilegedRoles = [Roles.Administrator, Roles.Manager];

    public static IQueryable<Entities.Transporter> Query(IApplicationDbContext context, Guid userId, Guid accountId, bool privileged)
        => privileged
            ? context.Transporters.Where(t => t.AccountId == accountId)
            : context.UsersGroup
                .Where(ug => ug.UserId == userId && ug.Group.Active && ug.Group.AccountId == accountId)
                .SelectMany(ug => ug.Group.Transporters)
                .Where(t => t.AccountId == accountId)
                .Distinct();

    public static async Task<bool> IsPrivilegedAsync(IApplicationDbContext context, Guid userId, CancellationToken cancellationToken)
        => IsPrivilegedRole(await context.Users
            .Where(u => u.UserId == userId)
            .Select(u => u.Role)
            .FirstOrDefaultAsync(cancellationToken));
}
