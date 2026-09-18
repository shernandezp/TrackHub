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
using TrackHub.TripManagement.Application.Common;

namespace TrackHub.TripManagement.Application.Trips.Queries.GetTripTimeline;

// No [Caching] — scope comes from the caller identity (SVD-09). See GetTripsQuery.
/// <summary>Paged <c>TripEvent</c> history: manual overrides and detections in one log.</summary>
[Authorize(Resource = Resources.Trips, Action = Actions.Read)]
[RequireFeature(FeatureKeys.TripManagement)]
// Enforcement: the handler derives the caller's own account and passes it to the reader/writer,
// which filters every row on it (TripVisibility is the single visibility resolver - spec 11).
[AccountScopeEnforcedInHandler]
public readonly record struct GetTripTimelineFeedQuery(Guid TripId, string? Cursor, int? Take) : IRequest<TripTimelineFeedPageVm>;

public sealed class GetTripTimelineFeedQueryHandler(
    ITripReader reader,
    IUserReader userReader,
    IUser user) : IRequestHandler<GetTripTimelineFeedQuery, TripTimelineFeedPageVm>
{
    private const int DefaultPageSize = 50;
    private const int MaxPageSize = 200;

    private Guid UserId { get; } = TripVisibility.RequireUserId(user);

    public async Task<TripTimelineFeedPageVm> Handle(GetTripTimelineFeedQuery request, CancellationToken cancellationToken)
    {
        var caller = await userReader.GetUserAsync(UserId, cancellationToken);
        var take = Math.Clamp(request.Take ?? DefaultPageSize, 1, MaxPageSize);

        return await reader.GetTimelineAsync(
            request.TripId, caller.AccountId, TripVisibility.ResolveScopeUserId(user, UserId), request.Cursor, take, cancellationToken);
    }
}

public sealed class GetTripTimelineFeedValidator : AbstractValidator<GetTripTimelineFeedQuery>
{
    public GetTripTimelineFeedValidator()
    {
        RuleFor(v => v.TripId).NotEmpty();
        RuleFor(v => v.Take).InclusiveBetween(1, 200).When(v => v.Take.HasValue);
    }
}

/// <summary>Behind the deprecated <c>tripTimeline</c> field. Goes when the field does.</summary>
[Authorize(Resource = Resources.Trips, Action = Actions.Read)]
[RequireFeature(FeatureKeys.TripManagement)]
[AccountScopeEnforcedInHandler]
public readonly record struct GetTripTimelineQuery(Guid TripId, int? Skip, int? Take) : IRequest<TripTimelinePageVm>;

public sealed class GetTripTimelineQueryHandler(
    ITripReader reader,
    IUserReader userReader,
    IUser user) : IRequestHandler<GetTripTimelineQuery, TripTimelinePageVm>
{
    private Guid UserId { get; } = TripVisibility.RequireUserId(user);

    public async Task<TripTimelinePageVm> Handle(GetTripTimelineQuery request, CancellationToken cancellationToken)
    {
        var caller = await userReader.GetUserAsync(UserId, cancellationToken);

        return await reader.GetTimelineByOffsetAsync(
            request.TripId,
            caller.AccountId,
            TripVisibility.ResolveScopeUserId(user, UserId),
            Math.Max(request.Skip ?? 0, 0),
            Math.Clamp(request.Take ?? 50, 1, 200),
            cancellationToken);
    }
}

public sealed class GetTripTimelineValidator : AbstractValidator<GetTripTimelineQuery>
{
    public GetTripTimelineValidator()
    {
        RuleFor(v => v.TripId).NotEmpty();
        RuleFor(v => v.Skip).GreaterThanOrEqualTo(0).When(v => v.Skip.HasValue);
        RuleFor(v => v.Take).InclusiveBetween(1, 200).When(v => v.Take.HasValue);
    }
}
