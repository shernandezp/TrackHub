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

namespace TrackHub.Router.Domain.Interfaces;

// Serializes device synchronization per operator within a process so a user's manual sync and the
// background sync loop (or two manual triggers) cannot run concurrently for the same operator —
// which would race the device-catalog reset/rebuild. In-process only, matching the single-instance
// SyncWorker; scaling the worker out needs a cross-instance claim (advisory lock / SKIP LOCKED).
public interface IOperatorSyncLock
{
    // Dispose the returned handle to release the gate.
    Task<IDisposable> AcquireAsync(Guid operatorId, CancellationToken cancellationToken);
}
