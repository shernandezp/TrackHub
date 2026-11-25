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

using Common.Web.Infrastructure;
using TrackHub.Manager.Domain.Enums;
using TrackHub.Manager.Domain.Interfaces;

namespace TrackHub.Manager.Web.Endpoints;

/// <summary>
/// Anonymous public-link resolution; the route, parameters, status codes and JSON body are a fixed contract.
/// <para>
/// Calls <see cref="IPublicLinkGrantResolver"/> directly rather than through the mediator: there is no
/// principal for the pipeline's authorization behaviors, and admitting unauthenticated callers to the
/// command would also expose it to unauthenticated GraphQL traffic.
/// </para>
/// </summary>
public sealed class PublicLinks : EndpointGroupBase
{
    public override void Map(WebApplication app)
    {
        app.MapGet("~/public-links/{publicLinkGrantId:guid}", GetPublicLink);
    }

    public static async Task<IResult> GetPublicLink(
        Guid publicLinkGrantId,
        Guid accountId,
        string resourceType,
        string resourceId,
        string scope,
        string token,
        IPublicLinkGrantResolver resolver,
        CancellationToken cancellationToken)
    {
        if (accountId == Guid.Empty
            || string.IsNullOrWhiteSpace(resourceType)
            || string.IsNullOrWhiteSpace(resourceId)
            || string.IsNullOrWhiteSpace(scope)
            || string.IsNullOrWhiteSpace(token))
        {
            return Results.BadRequest();
        }

        var result = await resolver.ResolvePublicLinkGrantAsync(
            publicLinkGrantId, accountId, resourceType, resourceId, scope, token, cancellationToken);

        if (result.Resolution == PublicLinkResolution.Expired)
        {
            return Results.StatusCode(StatusCodes.Status410Gone);
        }

        // NotFound covers "no such grant", "revoked" and "scope not granted" alike — non-disclosure.
        if (result.Resolution != PublicLinkResolution.Found || result.Grant is not { } grant)
        {
            return Results.NotFound();
        }

        // The grant's Token is never included here.
        return Results.Ok(new
        {
            grant.PublicLinkGrantId,
            grant.AccountId,
            grant.ResourceType,
            grant.ResourceId,
            grant.Scopes,
            grant.Purpose,
            grant.ExpiresAt,
            grant.AccessCount,
            grant.LastAccessedAt
        });
    }
}
