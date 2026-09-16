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

namespace Common.Domain.Constants;

/// <summary>
/// The identities the Security and Manager seeders must agree on.
/// <para>
/// Each seeder used to mint its own <c>Guid.NewGuid()</c>, so on a fresh environment the bootstrap
/// administrator's token carried an <c>account_id</c> that existed in no Manager row and a subject
/// matching no <c>app.users</c> replica — every Manager surface that resolves the caller through
/// the replica then denied or faulted.
/// </para>
/// </summary>
public static class PlatformBootstrap
{
    public static readonly Guid MasterAccountId = new("9f1d5a10-0000-4000-8000-000000000001");

    public static readonly Guid AdministratorUserId = new("9f1d5a10-0000-4000-8000-000000000002");
}
