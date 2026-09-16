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

using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;
using Common.Application.Interfaces;

namespace TrackHub.Manager.Infrastructure.Writers;

public sealed class TransporterTypeWriter(IApplicationDbContext context, ICurrentPrincipal principal) : ITransporterTypeWriter
{

    /// <summary>
    /// Update a transporter type based on the provided transporter type DTO.
    /// </summary>
    /// <param name="transporterTypeDto"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    /// <exception cref="NotFoundException"></exception>
    public async Task UpdateTransporterTypeAsync(TransporterTypeDto transporterTypeDto, CancellationToken cancellationToken)
    {
        var transporterType = await context.TransporterTypes.FindAsync([transporterTypeDto.TransporterTypeId], cancellationToken)
            ?? throw new NotFoundException(nameof(TransporterType), $"{transporterTypeDto.TransporterTypeId}");

        context.TransporterTypes.Attach(transporterType);

        var previous = Describe(transporterType);
        transporterType.AccBased = transporterTypeDto.AccBased;
        transporterType.StoppedGap = transporterTypeDto.StoppedGap;
        transporterType.MaxDistance = transporterTypeDto.MaxDistance;
        transporterType.MaxTimeGap = transporterTypeDto.MaxTimeGap;

        // Transporter types are platform-wide, so the audit row carries the platform account.
        context.AuditEvents.Add(AuditTrail.Create(principal, Guid.Empty, "UpdateTransporterType", nameof(TransporterType),
            $"{transporterType.TransporterTypeId}", previous, Describe(transporterType)));
        await context.SaveChangesAsync(cancellationToken);
    }

    private static string Describe(TransporterType transporterType)
        => $$"""{"accBased":{{transporterType.AccBased.ToString().ToLowerInvariant()}},"stoppedGap":{{AuditJson.Number(transporterType.StoppedGap)}},"maxDistance":{{AuditJson.Number(transporterType.MaxDistance)}},"maxTimeGap":{{AuditJson.Number(transporterType.MaxTimeGap)}}}""";
}
