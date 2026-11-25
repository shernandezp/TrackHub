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
/// Requires the account feature flag to be enabled for the request's <c>AccountId</c>, falling back to
/// the principal's account; enforced by <see cref="Common.Application.Behaviors.FeatureFlagBehavior{TRequest, TResponse}"/>.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct, AllowMultiple = true, Inherited = true)]
public sealed class RequireFeatureAttribute(string featureKey) : Attribute
{
    public string FeatureKey { get; } = featureKey;

    /// <summary>
    /// When true, service clients with no account scope bypass the check; set false for system-level
    /// commands that must still fail closed against per-account configuration.
    /// </summary>
    public bool AllowGlobalServiceClient { get; set; } = true;
}
