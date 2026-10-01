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

using System.Reflection;
using Microsoft.EntityFrameworkCore.Diagnostics;
using TrackHub.Manager.Infrastructure.Entities;

namespace TrackHub.Manager.Infrastructure.ManagerDB;

// Bumps the edit version whenever a save changes anything a user could have edited, whichever writer made it.
public sealed class EditVersionInterceptor : SaveChangesInterceptor
{
    private static readonly HashSet<string> Bookkeeping =
        [nameof(IEditVersioned.Version), "Created", "CreatedBy", "LastModified", "LastModifiedBy"];

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        Bump(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        Bump(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void Bump(DbContext? context)
    {
        if (context is null)
        {
            return;
        }

        foreach (var entry in context.ChangeTracker.Entries<IEditVersioned>().Where(e => e.State == EntityState.Modified))
        {
            var userFacingChange = entry.Properties.Any(p =>
                p.IsModified
                && !Bookkeeping.Contains(p.Metadata.Name)
                && p.Metadata.PropertyInfo?.GetCustomAttribute<JobMaintainedAttribute>() is null);
            if (userFacingChange)
            {
                var version = entry.Property(e => e.Version);
                version.CurrentValue = version.OriginalValue + 1;
            }
        }
    }
}
