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

using Ardalis.GuardClauses;
using Common.Application.Exceptions;
using AppValidationException = Common.Application.Exceptions.ValidationException;
using TrackHub.TripManagement.Domain.Constants;
using TrackHub.TripManagement.Domain.Records;

namespace TrackHub.TripManagement.Application.Common;

/// <summary>
/// Turns an exception raised while processing one partner item into a result row. Partners receive a
/// code from the module's vocabulary and never a raw exception message, which would hand a third
/// party the schema, table or constraint names an EF or Npgsql failure carries.
/// </summary>
public static class PartnerErrorResult
{
    private const string GenericMessage = "The item could not be processed.";

    public static TripImportResultVm Describe(Exception exception, string externalReference, Guid? tripId, string fallbackCode)
        => exception switch
        {
            AppValidationException validation => Failed(externalReference, tripId, validation.Code, validation.Code),
            ConflictException conflict => Failed(externalReference, tripId, conflict.Code, conflict.Code),
            NotFoundException => Failed(externalReference, tripId, TripErrorCodes.TripNotFound, TripErrorCodes.TripNotFound),
            ForbiddenAccessException => Failed(externalReference, tripId, TripErrorCodes.Forbidden, TripErrorCodes.Forbidden),
            _ => Failed(externalReference, tripId, fallbackCode, GenericMessage)
        };

    private static TripImportResultVm Failed(string externalReference, Guid? tripId, string code, string message)
        => new(externalReference, false, tripId, code, message);
}
