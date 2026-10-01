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

using TrackHub.Manager.Infrastructure.Entities;

namespace TrackHub.Manager.Infrastructure.ManagerDB;

// A dialog saves against the edit version it loaded: a row another user changed since is refused
// (CONCURRENT_UPDATE) rather than silently overwritten. EditVersionInterceptor bumps the version.
internal static class RowVersion
{
    public static void Expect<T>(DbSet<T> set, T entity, uint? expectedVersion) where T : class, IEditVersioned
    {
        if (expectedVersion is { } version)
        {
            set.Entry(entity).Property(e => e.Version).OriginalValue = version;
        }
    }
}
