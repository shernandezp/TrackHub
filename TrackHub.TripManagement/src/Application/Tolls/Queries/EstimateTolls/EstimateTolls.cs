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

using Common.Domain.Time;
using Ardalis.GuardClauses;
using Common.Application.Interfaces;
using TrackHub.TripManagement.Application.Common;
using TrackHub.TripManagement.Application.Tolls.Services.Interfaces;

namespace TrackHub.TripManagement.Application.Tolls.Queries.EstimateTolls;

/// <summary>
/// The planner's "what-if": re-runs toll matching over a stored plan for a different vehicle class
/// WITHOUT persisting anything, so an operator can compare classes before committing.
/// </summary>
[Authorize(Resource = Resources.Trips, Action = Actions.Read)]
[RequireFeature(FeatureKeys.TripManagement)]
// Enforcement: the handler derives the caller's own account and passes it to the reader/writer,
// which filters every row on it (TripVisibility is the single visibility resolver).
[AccountScopeEnforcedInHandler]
public readonly record struct EstimateTollsQuery(Guid RoutePlanId, string? TollVehicleClass) : IRequest<TollEstimateVm>;

public sealed class EstimateTollsQueryHandler(
    IRoutePlanReader routePlanReader,
    ITripReader tripReader,
    ITollEstimationService tollEstimationService,
    IAccountFeatureReader accountFeatureReader,
    IUserReader userReader,
    IUser user,
    IAccountTimeZoneResolver? zones = null) : IRequestHandler<EstimateTollsQuery, TollEstimateVm>
{
    private Guid UserId { get; } = TripVisibility.RequireUserId(user);

    public async Task<TollEstimateVm> Handle(EstimateTollsQuery request, CancellationToken cancellationToken)
    {
        var caller = await userReader.GetUserAsync(UserId, cancellationToken);
        var plan = await routePlanReader.GetPlanAsync(request.RoutePlanId, caller.AccountId, cancellationToken)
            ?? throw new NotFoundException(request.RoutePlanId.ToString(), nameof(RoutePlanVm));

        // The plan lookup is account-scoped but NOT group-scoped; GetTripAsync on the plan's TripId applies
        // the Visible() predicate, so an unknown plan and another group's plan are indistinguishable.
        var trip = await tripReader.GetTripAsync(plan.TripId, caller.AccountId, TripVisibility.ResolveScopeUserId(user, UserId), cancellationToken);

        var geometry = await routePlanReader.GetPlanGeometryAsync(request.RoutePlanId, caller.AccountId, cancellationToken);
        var config = await accountFeatureReader.GetAccountConfigAsync(caller.AccountId, cancellationToken);

        return await tollEstimationService.EstimateAsync(
            geometry,
            request.TollVehicleClass ?? plan.TollVehicleClass,
            // Priced on the trip's PLANNED START, exactly as PlanTripRouteCommand prices the stored
            // estimate, so the planner panel and the persisted figure agree for the same vehicle class even when a
            // tariff changed between planning and departure. Tariffs are temporal, so the date is part of the answer.
            (await (zones ?? UtcAccountTimeZoneResolver.Instance).ResolveAsync(trip.AccountId, cancellationToken)).DateOf(trip.PlannedStartAt),
            config.TollMatchToleranceMeters,
            cancellationToken);
    }
}

public sealed class EstimateTollsValidator : AbstractValidator<EstimateTollsQuery>
{
    public EstimateTollsValidator()
    {
        RuleFor(v => v.RoutePlanId).NotEmpty();
        RuleFor(v => v.TollVehicleClass).MaximumLength(20);
    }
}
