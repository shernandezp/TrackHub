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

namespace TrackHub.Router.Domain.Helpers;

/// <summary>
/// How many device ids one provider request may carry when the ids travel in the URL.
/// <para>
/// Past a few hundred devices a single query string reaches the provider/proxy URI limit and the
/// whole position cycle fails with 414/400 for that operator, so batch reads split the id list into
/// requests of this size and merge the results.
/// </para>
/// </summary>
public static class ProviderBatching
{
    public const int MaxIdsPerRequest = 100;
}
