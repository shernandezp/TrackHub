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

namespace TrackHub.Manager.Domain.Interfaces;

/// <summary>
/// Turns a template key and its tokens into the text a channel provider sends. Backed by the
/// account's notification templates, so it is infrastructure — but both the dispatcher and the
/// digest job need it, and neither should reach into the templates table itself.
/// </summary>
public interface INotificationRenderer
{
    /// <summary>The recipient's own language when the recipient is a user, else the rule locale, else English.</summary>
    Task<string> ResolveLocaleAsync(
        string recipientPrincipalType, string recipient, string? ruleLocale, CancellationToken cancellationToken);

    Task<(string? Subject, string Body)> RenderAsync(
        Guid accountId, string templateKey, string channel, string locale,
        IReadOnlyDictionary<string, string> tokens, CancellationToken cancellationToken);
}
