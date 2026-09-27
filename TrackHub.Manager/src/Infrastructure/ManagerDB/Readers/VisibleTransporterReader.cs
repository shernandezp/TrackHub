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
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Readers;

/// <summary>
/// The single transporter-visibility primitive.
/// </summary>
public sealed class VisibleTransporterReader(IApplicationDbContext context, ICurrentPrincipal principal)
    : AccountScopedDataAccess(context, principal), IVisibleTransporterReader
{
    public async Task<IReadOnlySet<Guid>> GetVisibleTransporterIdsAsync(Guid userId, Guid accountId, CancellationToken cancellationToken)
    {
        var scopedAccountId = RequireAccountAccess(accountId);

        // The caller's own token decides for the caller; for any other user the replicated role
        // does, so a service asking on a user's behalf never inherits its own account-wide reach.
        var privileged = Principal.UserId == userId
            ? IsPrivileged
            : await TransporterVisibility.IsPrivilegedAsync(Context, userId, cancellationToken);

        var ids = await TransporterVisibility.Query(Context, userId, scopedAccountId, privileged)
            .Select(t => t.TransporterId)
            .ToListAsync(cancellationToken);
        return ids.ToHashSet();
    }
}
