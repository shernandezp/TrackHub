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

using FluentValidation.Results;

namespace TrackHub.Manager.Application.Lookups;

/// <summary>
/// The bound for reads whose consumer needs the WHOLE set by construction and which therefore must
/// not be paged: the SyncWorker hands its device catalog to a GPS provider as "fetch exactly these",
/// and the live map plots one marker per assigned transporter. Paging either would stop position
/// sync for the rows past the window — invisibly, and stickily once cached. So the set stays whole
/// and an implausible size is raised instead of quietly trimmed.
/// </summary>
public static class UnpagedReadLimits
{
    public const int Ceiling = 20_000;

    public const string LimitExceededCode = "UNPAGED_READ_LIMIT_EXCEEDED";

    public static IReadOnlyCollection<T> EnsureWithinCeiling<T>(IReadOnlyCollection<T> rows, string readName)
        => rows.Count <= Ceiling
            ? rows
            : throw new Common.Application.Exceptions.ValidationException(LimitExceededCode,
            [
                new ValidationFailure(readName,
                    $"The {readName} read returned more than {Ceiling} records, which exceeds what a single unpaged read may carry.")
            ]);
}
