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

namespace Common.Application.Exceptions;

public class ValidationException : Exception
{
    public const string DefaultCode = "VALIDATION_ERROR";

    public ValidationException()
        : base("One or more validation failures have occurred.")
    {
        Errors = new Dictionary<string, string[]>();
        Code = DefaultCode;
    }

    public ValidationException(IEnumerable<ValidationFailure> failures)
        : this()
    {
        Errors = failures
            .GroupBy(e => e.PropertyName, e => e.ErrorMessage)
            .ToDictionary(failureGroup => failureGroup.Key, failureGroup => failureGroup.ToArray());
    }

    /// <summary>
    /// A rejection carrying a specific machine-readable code (<c>TRIP_NOT_ACTIVE</c>, …) that the GraphQL
    /// error filter surfaces as the error code.
    /// </summary>
    public ValidationException(string code, IEnumerable<ValidationFailure> failures)
        : this(failures)
    {
        Code = code;
    }

    public IDictionary<string, string[]> Errors { get; }

    public string Code { get; }
}
