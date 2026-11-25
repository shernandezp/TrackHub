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
/// Declares a deliberate cross-tenant surface: the only opt-out from the fail-closed
/// <see cref="Common.Application.Behaviors.AccountScopeBehavior{TRequest, TResponse}"/>. Tenant-bound
/// service clients must not be marked; they are expected to fail closed against another tenant.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct, AllowMultiple = false, Inherited = true)]
public sealed class AllowCrossAccountAttribute : Attribute
{
    public AllowCrossAccountAttribute(string justification)
    {
        if (string.IsNullOrWhiteSpace(justification))
        {
            throw new ArgumentException(
                "A cross-account declaration requires a justification explaining why the request may act outside the caller's account.",
                nameof(justification));
        }

        Justification = justification;
    }

    public string Justification { get; }
}
