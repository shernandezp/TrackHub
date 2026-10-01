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

using Common.Domain.Constants;

namespace DBInitializer;

// Dispatchers run driver operations without owning the driver catalogue, which stays Drivers.
internal sealed class DriverOperationsRbacSeedContribution : IRbacSeedContribution
{
    private static readonly string[] Operate = [Actions.Read, Actions.Write, Actions.Edit];

    public IReadOnlyList<string> Resources { get; } = [Common.Domain.Constants.Resources.DriverOperations];

    public IReadOnlyList<string> CustomActionResources { get; } = [];

    public IReadOnlyDictionary<string, (string Resource, string[] Actions)[]> RoleGrants { get; } =
        new Dictionary<string, (string Resource, string[] Actions)[]>
        {
            [Roles.Manager] = [(Common.Domain.Constants.Resources.DriverOperations, Operate)],
            [Roles.User] = [(Common.Domain.Constants.Resources.DriverOperations, Operate)],
        };

    public IReadOnlyList<string> ServiceClientNames { get; } = [];

    public IReadOnlyList<(string[] Clients, (string Resource, string Action)[] Grants)> ServiceClientGrants { get; } = [];
}
