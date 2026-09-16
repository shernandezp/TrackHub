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

using System.Diagnostics.CodeAnalysis;

namespace TrackHub.Manager.Infrastructure.ManagerDB;

/// <summary>
/// Turns a by-id read that found nothing into NOT_FOUND.
/// <para>
/// A by-id reader that ends in <c>FirstAsync</c> answers a nonexistent id with an unhandled 500
/// while another tenant's id gets a clean 403 from the account guard — an observable existence
/// oracle over guessable ids, and a permanent source of error-log noise. Most projections are
/// record structs, so the check is a default comparison rather than a null one.
/// </para>
/// </summary>
internal static class ReaderResults
{
    internal static void EnsureFound<T>([NotNull] T value, string name, string key)
    {
        if (value is null || EqualityComparer<T>.Default.Equals(value, default!))
        {
            throw new NotFoundException(name, key);
        }
    }
}
