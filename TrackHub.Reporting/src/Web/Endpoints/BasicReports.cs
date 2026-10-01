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

using ExceptionConverter = Common.Application.Exceptions.ExceptionConverter;
using PlatformErrorCodes = Common.Application.Exceptions.PlatformErrorCodes;
using ValidationException = Common.Application.Exceptions.ValidationException;
using ConflictException = Common.Application.Exceptions.ConflictException;
using HotChocolate;
using TrackHub.Reporting.Application.Report.Queries.Get;
using TrackHub.Reporting.Domain.Exceptions;

namespace TrackHub.Reporting.Web.Endpoints;

public class BasicReports : EndpointGroupBase
{
    public override void Map(WebApplication app)
    {
        app.MapGroup(this)
            .RequireAuthorization()
            .MapPost(GetReport)
            .MapPost(GetReportPreview, "preview");
    }

    // POST /api/BasicReports — streams the rendered report file (xlsx by default, pdf when requested).
    // The `format` field is optional; existing portal payloads without it keep working.
    public async Task<IResult> GetReport(ISender sender, GetReportQuery query)
    {
        try
        {
            var result = await sender.Send(query);
            return Results.File(result.Content, result.ContentType, $"{query.ReportCode}{result.FileExtension}");
        }
        catch (Exception ex) when (TryMapException(ex, out var mapped))
        {
            return mapped;
        }
    }

    // POST /api/BasicReports/preview — returns the JSON preview (first PreviewRows rows + totals).
    public async Task<IResult> GetReportPreview(ISender sender, GetReportPreviewQuery query)
    {
        try
        {
            var result = await sender.Send(query);
            return Results.Json(result);
        }
        catch (Exception ex) when (TryMapException(ex, out var mapped))
        {
            return mapped;
        }
    }

    // Maps the report pipeline's domain exceptions to the shared error envelope + status codes
    //. Returns false (so the exception filter lets it propagate to the global handler)
    // for any exception it does not own.
    private static bool TryMapException(Exception ex, out IResult result)
    {
        result = ex switch
        {
            ReportNotFoundException e => ErrorResult(
                StatusCodes.Status404NotFound, e.Message, e.Code, new { reportCode = e.ReportCode }),
            FeatureDisabledException e => ErrorResult(
                StatusCodes.Status403Forbidden, e.Message, e.Code, new { featureKey = e.FeatureKey }),
            ReportAccessDeniedException e => ErrorResult(
                StatusCodes.Status403Forbidden, e.Message, e.Code, new { reportCode = e.ReportCode }),
            UnsupportedReportFormatException e => ErrorResult(
                StatusCodes.Status400BadRequest, e.Message, e.Code, new { format = e.Format }),
            ReportLimitExceededException e => ErrorResult(
                StatusCodes.Status400BadRequest, e.Message, e.Code, new { maxRows = e.MaxRows }),
            ReportWindowInvalidException e => ErrorResult(
                StatusCodes.Status400BadRequest, e.Message, e.Code, new { maxDays = e.MaxDays }),
            GraphQLException e when e.Errors.Count > 0 => ErrorResult(
                UpstreamStatus(e.Errors[0].Code), e.Errors[0].Message, e.Errors[0].Code ?? ExceptionConverter.UpstreamErrorCode, new { }),
            _ => null!
        };
        return result is not null;
    }

    // A feed a producer refused keeps the producer's meaning: only an outage is a 5xx, a coded refusal is the caller's to fix.
    private static int UpstreamStatus(string? code) => code switch
    {
        PlatformErrorCodes.Forbidden or PlatformErrorCodes.FeatureDisabled or PlatformErrorCodes.AccountSuspended => StatusCodes.Status403Forbidden,
        PlatformErrorCodes.NotFound => StatusCodes.Status404NotFound,
        ValidationException.DefaultCode => StatusCodes.Status400BadRequest,
        PlatformErrorCodes.TooManyRequests => StatusCodes.Status429TooManyRequests,
        PlatformErrorCodes.Unauthorized => StatusCodes.Status401Unauthorized,
        null or ExceptionConverter.UpstreamErrorCode => StatusCodes.Status502BadGateway,
        ConflictException.DefaultCode or ConflictException.ConcurrentUpdateCode => StatusCodes.Status409Conflict,
        _ => StatusCodes.Status422UnprocessableEntity,
    };

    private static IResult ErrorResult(int statusCode, string message, string code, object extraExtensions)
        => Results.Json(
            new
            {
                errors = new[]
                {
                    new
                    {
                        message,
                        extensions = Merge(code, extraExtensions)
                    }
                }
            },
            statusCode: statusCode);

    private static Dictionary<string, object?> Merge(string code, object extraExtensions)
    {
        var extensions = new Dictionary<string, object?> { ["code"] = code };
        foreach (var property in extraExtensions.GetType().GetProperties())
        {
            extensions[property.Name] = property.GetValue(extraExtensions);
        }
        return extensions;
    }
}
