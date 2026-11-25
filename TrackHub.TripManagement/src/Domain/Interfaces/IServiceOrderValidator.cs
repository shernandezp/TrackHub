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

namespace TrackHub.TripManagement.Domain.Interfaces;

/// <summary>
/// Validates a trip's optional <c>ServiceOrderId</c> against the trip's account.
/// <para>
/// This module has no service-order store, so the default implementation is permissive. Create and
/// update validate the reference exactly like the transporter, staff and geofence, so a real
/// implementation registered over this port enforces it on every trip write with no handler change.
/// </para>
/// </summary>
public interface IServiceOrderValidator
{
    /// <summary>
    /// True when the service order exists and belongs to <paramref name="accountId"/>. Callers pass
    /// only non-null ids; a null <c>ServiceOrderId</c> means "no service order" and is always valid.
    /// </summary>
    Task<bool> ExistsInAccountAsync(Guid serviceOrderId, Guid accountId, CancellationToken cancellationToken);
}
