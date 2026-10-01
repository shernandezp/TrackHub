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

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Npgsql;

namespace Common.Infrastructure;

// PostgreSQL unique violations behind an EF DbUpdateException. Writers that enforce uniqueness in
// the database match the named index to give the specific answer; anything unmatched is mapped to
// CONFLICT by the error filters.
public static class UniqueViolation
{
    public const string SqlState = "23505";

    // The constraint name must match: a violation on another index is a different refusal.
    public static bool Matches(DbUpdateException exception, string indexName)
        => exception.InnerException is PostgresException postgres
            && string.Equals(postgres.SqlState, SqlState, StringComparison.Ordinal)
            && postgres.ConstraintName?.Contains(indexName, StringComparison.OrdinalIgnoreCase) == true;

    public static bool Matches(DbUpdateException exception)
        => exception.InnerException is PostgresException postgres
            && string.Equals(postgres.SqlState, SqlState, StringComparison.Ordinal);

    // The context is request-scoped: after a failed save the rejected entries must leave the tracker,
    // or the next save in the same request re-sends them.
    public static void Detach(ChangeTracker tracker)
    {
        foreach (var entry in tracker.Entries().ToList())
        {
            entry.State = EntityState.Detached;
        }
    }
}
