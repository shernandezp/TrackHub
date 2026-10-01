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

using TrackHub.Router.Domain.Models;

namespace TrackHub.Router.Domain.Interfaces;

// Per-operator exponential backoff for the background sync/health loops. A persistently failing
// operator (e.g. wrong credentials, a decommissioned provider) must not be re-attempted at full
// cadence forever — that hammers the provider, spams logs, and wastes cycles (router-audit A-15).
// The window is persisted in Manager and read back on the operator projection, so it survives a
// worker restart.
public interface IOperatorSyncBackoff
{
    Task RecordSuccessAsync(OperatorVm @operator, CancellationToken cancellationToken);

    Task RecordFailureAsync(OperatorVm @operator, DateTimeOffset now, CancellationToken cancellationToken);
}
