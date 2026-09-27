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

using System.Text.Json;
using System.Text.Json.Nodes;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Services;

/// <summary>
/// The webhook signing secret lives in a rule's configurationJson. Reads never return it (the dispatch
/// path reads the row directly), and an update that omits it keeps the stored one, so the editor can
/// round-trip a rule without ever seeing the secret.
/// </summary>
internal static class NotificationRuleConfigurationJson
{
    public const string SecretKey = "webhookSecret";
    public const string SecretSetKey = "webhookSecretSet";

    public static string? Redact(string? json)
    {
        var node = Parse(json);
        if (node is null || !node.ContainsKey(SecretKey))
        {
            return json;
        }

        node.Remove(SecretKey);
        node[SecretSetKey] = true;
        return node.ToJsonString();
    }

    public static string? PreserveSecret(string? incoming, string? stored)
    {
        var node = Parse(incoming);
        var storedSecret = Parse(stored)?[SecretKey]?.GetValue<string>();
        node?.Remove(SecretSetKey);
        if (node is null || storedSecret is null || node.ContainsKey(SecretKey) || !node.ContainsKey("webhookUrl"))
        {
            return incoming;
        }

        node[SecretKey] = storedSecret;
        return node.ToJsonString();
    }

    private static JsonObject? Parse(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        try
        {
            return JsonNode.Parse(json) as JsonObject;
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
