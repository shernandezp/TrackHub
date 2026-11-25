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
/// Declares that the request carries a key for a tenant-owned entity and that tenant scope is enforced
/// inside the handler, which loads the entity and checks caller access (reader guard, account filter or
/// explicit <c>AccountId</c> comparison). <see cref="Common.Application.Behaviors.AccountScopeBehavior{TRequest, TResponse}"/>
/// runs before the handler and cannot know the account, so that enforcement point is load-bearing.
/// It does not admit account-less principals; a service identity needing a keyed lookup uses a
/// dedicated request marked <see cref="AllowCrossAccountAttribute"/>.
/// </summary>
[AttributeUsage(AttributeTargets.Class | AttributeTargets.Struct, AllowMultiple = false, Inherited = true)]
public sealed class AccountScopeEnforcedInHandlerAttribute : Attribute;
