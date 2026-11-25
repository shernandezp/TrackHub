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

using System.Linq.Expressions;

namespace TrackHub.Manager.Infrastructure;

public static class DbSetExtensions
{

    /// <summary>
    /// Adds or updates with a single existing-row query; when several entities share a key, the last one wins.
    /// </summary>
    public static async Task BulkAddOrUpdateAsync<TEntity, TKey>(
        this DbSet<TEntity> dbSet,
        IEnumerable<TEntity> entities,
        Expression<Func<TEntity, TKey>> keySelector,
        IEnumerable<string> excludeProperties,
        CancellationToken cancellationToken = default)
        where TEntity : class
        where TKey : notnull
    {
        var entityList = entities.ToList();
        if (entityList.Count == 0)
            return;

        var compiledKeySelector = keySelector.Compile();

        var deduplicatedEntities = entityList
            .Select((entity, index) => (entity, index, key: compiledKeySelector(entity)))
            .Where(x => x.key != null)
            .GroupBy(x => x.key)
            .Select(g => g.OrderByDescending(x => x.index).First().entity)
            .ToList();

        var incomingKeys = deduplicatedEntities
            .Select(compiledKeySelector)
            .ToList();

        var parameter = Expression.Parameter(typeof(TEntity), "e");
        var keySelectorBody = Expression.Invoke(keySelector, parameter);

        // Create: e => incomingKeys.Contains(keySelector(e))
        var containsMethod = typeof(Enumerable)
            .GetMethods()
            .First(m => m.Name == nameof(Enumerable.Contains) && m.GetParameters().Length == 2)
            .MakeGenericMethod(typeof(TKey));

        var containsCall = Expression.Call(
            containsMethod,
            Expression.Constant(incomingKeys),
            keySelectorBody);

        var predicate = Expression.Lambda<Func<TEntity, bool>>(containsCall, parameter);

        var existingEntities = await dbSet
            .AsTracking()
            .Where(predicate)
            .ToListAsync(cancellationToken);

        var existingDict = existingEntities.ToDictionary(compiledKeySelector);

        var excludeSet = excludeProperties.ToHashSet();

        var propertyInfoCache = typeof(TEntity)
            .GetProperties()
            .Where(p => p.CanRead && p.CanWrite)
            .ToDictionary(p => p.Name);

        foreach (var entity in deduplicatedEntities)
        {
            var key = compiledKeySelector(entity);

            if (existingDict.TryGetValue(key, out var existingEntity))
            {
                var entry = dbSet.Entry(existingEntity);

                var properties = entry.Properties.Select(p => p.Metadata.Name);

                foreach (var property in properties)
                {
                    if (excludeSet.Contains(property))
                        continue;

                    if (propertyInfoCache.TryGetValue(property, out var propertyInfo))
                    {
                        var oldValue = propertyInfo.GetValue(existingEntity);
                        var newValue = propertyInfo.GetValue(entity);

                        if (!Equals(oldValue, newValue))
                        {
                            entry.Property(property).CurrentValue = newValue;
                            entry.Property(property).IsModified = true;
                        }
                    }
                }
            }
            else
            {
                await dbSet.AddAsync(entity, cancellationToken);
            }
        }
    }
}
