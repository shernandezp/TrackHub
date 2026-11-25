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

namespace Common.Application.Attributes;

/// <summary>
/// Declares that the request touches platform-owned data, identical for every tenant, so
/// <see cref="Common.Application.Behaviors.AccountScopeBehavior{TRequest, TResponse}"/> passes it through
/// even without an account scope. Not for tenant data that merely lacks an <c>AccountId</c> on the wire:
/// caller-derived requests need no marker, keyed requests use <see cref="AccountScopeEnforcedInHandlerAttribute"/>,
/// and cross-tenant surfaces use <see cref="AllowCrossAccountAttribute"/>. It does not exempt an account-bearing request.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct, AllowMultiple = false, Inherited = true)]
public sealed class PlatformScopedAttribute : Attribute
{
    public PlatformScopedAttribute(string justification)
    {
        if (string.IsNullOrWhiteSpace(justification))
        {
            throw new ArgumentException(
                "A platform-scoped declaration requires a justification naming the platform owner of the data (e.g. \"seeded RBAC catalog\", \"SVD-10 platform status\").",
                nameof(justification));
        }

        Justification = justification;
    }

    public string Justification { get; }
}
