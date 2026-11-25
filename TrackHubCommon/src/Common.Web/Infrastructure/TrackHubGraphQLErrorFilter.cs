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

using Common.Application.Exceptions;
using Common.Infrastructure;
using HotChocolate;
using HotChocolate.Execution;
using Microsoft.EntityFrameworkCore;

namespace Common.Web.Infrastructure;

public sealed class TrackHubGraphQLErrorFilter : IErrorFilter
{
    public IError OnError(IError error)
    {
        if (error.Exception is ForbiddenAccessException forbidden)
        {
            var builder = ErrorBuilder.FromError(error)
                .SetMessage(forbidden.Message)
                .SetCode(PlatformErrorCodes.Forbidden);

            if (!string.IsNullOrWhiteSpace(forbidden.Resource))
            {
                builder.SetExtension("requiredResource", forbidden.Resource);
            }

            if (!string.IsNullOrWhiteSpace(forbidden.Action))
            {
                builder.SetExtension("requiredAction", forbidden.Action);
            }

            return builder.Build();
        }

        if (error.Exception is FeatureDisabledException featureDisabled)
        {
            return ErrorBuilder.FromError(error)
                .SetMessage(featureDisabled.Message)
                .SetCode(PlatformErrorCodes.FeatureDisabled)
                .SetExtension("featureKey", featureDisabled.FeatureKey)
                .Build();
        }

        if (error.Exception is AccountSuspendedException accountSuspended)
        {
            return ErrorBuilder.FromError(error)
                .SetMessage(accountSuspended.Message)
                .SetCode(PlatformErrorCodes.AccountSuspended)
                .SetExtension("accountStatus", accountSuspended.Status.ToString())
                .Build();
        }

        if (error.Exception is TooManyRequestsException tooManyRequests)
        {
            var builder = ErrorBuilder.FromError(error)
                .SetMessage(tooManyRequests.Message)
                .SetCode(PlatformErrorCodes.TooManyRequests);

            if (tooManyRequests.RetryAfterSeconds is { } retryAfter)
            {
                builder.SetExtension("retryAfterSeconds", retryAfter);
            }

            return builder.Build();
        }

        if (error.Exception is UnauthorizedAccessException)
        {
            return ErrorBuilder.FromError(error)
                .SetMessage("Authentication is required.")
                .SetCode(PlatformErrorCodes.Unauthorized)
                .Build();
        }

        // Cross-account ids are deliberately answered NotFound so they cannot be probed; the code lets the
        // caller tell that apart from a server fault.
        if (error.Exception is NotFoundException notFound)
        {
            return ErrorBuilder.FromError(error)
                .SetMessage(notFound.Message)
                .SetCode(PlatformErrorCodes.NotFound)
                .Build();
        }

        if (error.Exception is ConflictException conflict)
        {
            // conflict.Code, not a flat "CONFLICT": the specific literal is what a client branches on and what
            // the portal translates.
            return ErrorBuilder.FromError(error)
                .SetMessage(conflict.Message)
                .SetCode(conflict.Code)
                .Build();
        }

        // Specific codes such as TRIP_NOT_ACTIVE surface as the error code; field-level failures travel in an
        // `errors` extension so a form can highlight the offending input.
        if (error.Exception is ValidationException validation)
        {
            return ErrorBuilder.FromError(error)
                .SetMessage(validation.Message)
                .SetCode(validation.Code)
                .SetExtension("errors", validation.Errors.ToDictionary(e => e.Key, e => (object?)e.Value))
                .Build();
        }

        if (error.Exception is DbUpdateException update && UniqueViolation.Matches(update))
        {
            return ErrorBuilder.FromError(error)
                .SetMessage(CustomExceptionHandler.DuplicateMessage)
                .SetCode(ConflictException.DefaultCode)
                .Build();
        }

        if (error.Exception is DbUpdateConcurrencyException)
        {
            return ErrorBuilder.FromError(error)
                .SetMessage(CustomExceptionHandler.ConcurrentUpdateMessage)
                .SetCode(ConflictException.ConcurrentUpdateCode)
                .Build();
        }

        return error;
    }
}
