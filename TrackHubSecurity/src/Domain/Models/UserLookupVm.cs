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

namespace TrackHub.Security.Domain.Models;

/// <summary>
/// Minimal user projection for the role/policy allocator dialogs, which compute "available" as a set
/// difference against assigned members; the read must be complete, so it is unpaged and ceiling-checked.
/// </summary>
public readonly record struct UserLookupVm(
    Guid UserId,
    string Username);
