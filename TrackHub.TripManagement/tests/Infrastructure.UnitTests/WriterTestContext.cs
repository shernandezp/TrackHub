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
using Npgsql;
using TrackHub.TripManagement.Infrastructure.TripDB;
using Common.Infrastructure;

namespace Infrastructure.UnitTests;

/// <summary>
/// An in-memory <see cref="ApplicationDbContext"/> that can be told to answer the next
/// <c>SaveChangesAsync</c> with a PostgreSQL 23505 unique violation.
/// <para>
/// This exists so the writers' duplicate-handling branches are exercised for REAL rather than
/// simulated by stubbing a <c>false</c> return. What those branches get wrong is invisible to a
/// stub: catching the violation without detaching the failed <c>Added</c> entries leaves them in
/// the change tracker of a REQUEST-SCOPED context, so the very next <c>SaveChangesAsync</c> replays
/// the dead insert — a retried POD would come back as a 500 instead of an idempotent success, and any
/// genuine event later in the same request would be lost. Only a test that keeps saving on the same
/// context after the violation can see that.
/// </para>
/// <para>
/// <b>It runs <see cref="QueryTrackingBehavior.NoTracking"/>, because production does</b>
/// (<c>TripDB/DependencyInjection.cs</c>). Under <c>TrackAll</c> a query returns the instance the
/// change tracker already holds and <c>Attach</c> is a harmless no-op; under the deployed behaviour
/// it returns a SECOND instance and the attach throws. A harness that does not match the
/// registration proves nothing about the code that ships.
/// </para>
/// </summary>
internal sealed class WriterTestContext(DbContextOptions<ApplicationDbContext> options) : ApplicationDbContext(options)
{
    private int failuresRemaining;
    private string? failureConstraintName;

    internal static WriterTestContext Create()
        => new(new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"trip-writers-{Guid.NewGuid()}")
            .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options);

    /// <summary>Makes the next <paramref name="times"/> saves fail the way a duplicate insert does.</summary>
    internal void FailNextSave(int times = 1) => failuresRemaining = times;

    /// <summary>
    /// The same, but naming the index PostgreSQL says was violated.
    /// <para>
    /// PostgreSQL always names the violated constraint, and a writer's duplicate branch matches on that
    /// name, so only a named violation reaches it. It also proves that a duplicate station is reported
    /// as <c>TOLL_DUPLICATE_STATION</c> rather than as an overlapping tariff — an error about a
    /// different entity entirely.
    /// </para>
    /// </summary>
    internal void FailNextSaveOn(string constraintName, int times = 1)
    {
        failureConstraintName = constraintName;
        failuresRemaining = times;
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        if (failuresRemaining > 0)
        {
            failuresRemaining--;

            // The shape Npgsql actually produces: DbUpdateException wrapping a PostgresException
            // whose SqlState is 23505. The writers' `when (UniqueViolation.Matches(...))` filters
            // are matched against exactly this.
            var constraintName = failureConstraintName;
            failureConstraintName = null;

            throw new DbUpdateException(
                "An error occurred while saving the entity changes.",
                new PostgresException(
                    "duplicate key value violates unique constraint",
                    "ERROR",
                    "ERROR",
                    "23505",
                    constraintName: constraintName));
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
