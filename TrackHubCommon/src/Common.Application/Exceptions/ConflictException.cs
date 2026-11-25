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

namespace Common.Application.Exceptions;

/// <summary>A uniqueness or concurrency conflict; HTTP 409 / GraphQL <c>CONFLICT</c>.</summary>
public class ConflictException : Exception
{
    public const string DefaultCode = "CONFLICT";

    /// <summary>The row changed between the caller's read and its write (optimistic concurrency).</summary>
    public const string ConcurrentUpdateCode = "CONCURRENT_UPDATE";

    public ConflictException()
        : this("The resource already exists.")
    {
    }

    public ConflictException(string message)
        : base(message)
    {
        Code = DefaultCode;
    }

    /// <summary>
    /// A conflict carrying a specific machine-readable code (<c>TRIP_DUPLICATE_CODE</c>, …) that the
    /// GraphQL error filter surfaces as the error code.
    /// </summary>
    public ConflictException(string code, string message)
        : base(message)
    {
        Code = code;
    }

    public string Code { get; }

    /// <summary>
    /// A conflict whose code is also its message. Preferred over <c>new ConflictException(code)</c>, which
    /// binds to the message-only constructor and leaves <see cref="Code"/> at <see cref="DefaultCode"/>.
    /// </summary>
    public static ConflictException WithCode(string code) => new(code, code);
}
