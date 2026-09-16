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
using TrackHub.Telemetry.Infrastructure.TelemetryDB.Interfaces;

namespace TrackHub.Telemetry.Infrastructure.TelemetryDB.Writers;

// Writes reverse-geocoded addresses into the existing address columns of the stored
// history row and/or the latest-position row. Idempotent: rows that already carry an
// address are skipped so a repeated resolution never overwrites provider data.
public sealed class ResolvedAddressWriter(IApplicationDbContext context, ICurrentPrincipal principal)
    : AccountScopedDataAccess(context, principal), IResolvedAddressWriter
{
    public async Task<bool> PersistResolvedAddressAsync(
        Guid? transporterPositionHistoryId,
        Guid? transporterId,
        string? address,
        string? city,
        string? state,
        string? country,
        CancellationToken cancellationToken)
    {
        var updated = false;

        if (transporterPositionHistoryId.HasValue && transporterId.HasValue)
        {
            // The history row must belong to the named transporter. The caller vouches for the
            // transporter, never for the row id, so an unpaired row id would let any caller stamp an
            // address onto another tenant's history.
            var historyRow = await Context.TransporterPositionHistory
                .AsTracking()
                .FirstOrDefaultAsync(x => x.TransporterPositionHistoryId == transporterPositionHistoryId.Value
                    && x.TransporterId == transporterId.Value, cancellationToken);

            if (historyRow is not null && string.IsNullOrWhiteSpace(historyRow.Address))
            {
                RequireAccountAccess(historyRow.AccountId);
                historyRow.Address = address;
                historyRow.City = city;
                historyRow.State = state;
                historyRow.Country = country;
                updated = true;
            }
        }

        if (transporterId.HasValue)
        {
            var latestPosition = await Context.TransporterPositions
                .AsTracking()
                .FirstOrDefaultAsync(x => x.TransporterId == transporterId.Value, cancellationToken);

            if (latestPosition is not null && string.IsNullOrWhiteSpace(latestPosition.Address))
            {
                // transporter_position carries no accountid, so the owning account comes from the
                // transporter registry. Only an account-bound caller needs checking: the Router's
                // global service identity resolves addresses for every tenant by design.
                if (!CanAccessAllAccounts)
                {
                    var owner = await Context.Transporters
                        .Where(t => t.TransporterId == transporterId.Value)
                        .Select(t => (Guid?)t.AccountId)
                        .FirstOrDefaultAsync(cancellationToken);
                    RequireAccountAccess(owner ?? Guid.Empty);
                }

                latestPosition.Address = address;
                latestPosition.City = city;
                latestPosition.State = state;
                latestPosition.Country = country;
                updated = true;
            }
        }

        if (updated)
        {
            await Context.SaveChangesAsync(cancellationToken);
        }

        return updated;
    }
}
