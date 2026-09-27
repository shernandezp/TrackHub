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
using TrackHub.Manager.Domain.Constants;

namespace TrackHub.Manager.Application.Notifications;

/// <summary>
/// Formalized JSON contract validation for NotificationRule columns, shared by the
/// create/update rule validators. Legacy '' values parse as empty and stay valid. Account
/// membership of selector ids is enforced by the writer; formats are enforced here.
/// </summary>
public static class NotificationRuleContractRules
{
    // An update may omit the webhook secret: reads never return it and the writer keeps the stored one.
    public static void Apply<T>(AbstractValidator<T> validator, Func<T, NotificationRuleDto> selector, bool requireWebhookSecret = true)
    {
        if (requireWebhookSecret)
        {
            validator.RuleFor(x => selector(x)).Must(HaveWebhookSecretWhenSelected).OverridePropertyName("ConfigurationJson")
                .WithMessage("Rules with the Webhook channel require configurationJson.webhookSecret.");
        }

        validator.RuleFor(x => selector(x).RuleKey).NotEmpty().MaximumLength(255).OverridePropertyName("RuleKey");
        validator.RuleFor(x => selector(x).RuleType).NotEmpty().MaximumLength(255).OverridePropertyName("RuleType");
        validator.RuleFor(x => selector(x).TriggerEvent).NotEmpty().MaximumLength(255).Must(AlertEventTypes.All.Contains).OverridePropertyName("TriggerEvent")
            .WithMessage("triggerEvent must be one of the platform alert event types.");
        validator.RuleFor(x => selector(x).ChannelsJson).Must(BeValidChannels).OverridePropertyName("ChannelsJson")
            .WithMessage("channelsJson must be a JSON string array of known channels (InApp, Email, Webhook, WhatsApp, Push).");
        validator.RuleFor(x => selector(x).RecipientSelector).Must(BeValidRecipientSelector).OverridePropertyName("RecipientSelector")
            .WithMessage("recipientSelector must match the documented contract; contact addresses must be a valid email (Email) or E.164 phone (WhatsApp).");
        validator.RuleFor(x => selector(x).ThrottlingJson).Must(BeValidThrottling).OverridePropertyName("ThrottlingJson")
            .WithMessage("throttlingJson must match { dedupeWindowMinutes >= 0, digest None|Hourly|Daily, maxPerHour >= 1 }.");
        validator.RuleFor(x => selector(x)).Must(HaveWebhookConfigurationWhenSelected).OverridePropertyName("ConfigurationJson")
            .WithMessage("Rules with the Webhook channel require configurationJson.webhookUrl (absolute http/https).");
    }

    public static bool HaveWebhookSecretWhenSelected(NotificationRuleDto dto)
    {
        try
        {
            return !NotificationRuleContracts.ParseChannels(dto.ChannelsJson).Contains(NotificationChannels.Webhook)
                || !string.IsNullOrWhiteSpace(NotificationRuleContracts.ParseConfiguration(dto.ConfigurationJson).WebhookSecret);
        }
        catch (JsonException)
        {
            return false;
        }
    }

    public static bool BeValidChannels(string? channelsJson)
    {
        try
        {
            return NotificationRuleContracts.ParseChannels(channelsJson).All(NotificationChannels.IsValid);
        }
        catch (JsonException)
        {
            return false;
        }
    }

    public static bool BeValidRecipientSelector(string? recipientSelector)
    {
        try
        {
            var selector = NotificationRuleContracts.ParseRecipientSelector(recipientSelector);
            return (selector.Contacts ?? []).All(c =>
                (string.Equals(c.Channel, NotificationChannels.Email, StringComparison.OrdinalIgnoreCase) && NotificationRuleContracts.IsEmail(c.Address))
                || (string.Equals(c.Channel, NotificationChannels.WhatsApp, StringComparison.OrdinalIgnoreCase) && NotificationRuleContracts.IsE164(c.Address)));
        }
        catch (JsonException)
        {
            return false;
        }
    }

    public static bool BeValidThrottling(string? throttlingJson)
    {
        try
        {
            var throttling = NotificationRuleContracts.ParseThrottling(throttlingJson);
            return (throttling.DedupeWindowMinutes ?? 0) >= 0
                && (throttling.MaxPerHour ?? 1) >= 1
                && (throttling.Digest == null || DigestCadences.IsValid(throttling.Digest));
        }
        catch (JsonException)
        {
            return false;
        }
    }

    public static bool HaveWebhookConfigurationWhenSelected(NotificationRuleDto dto)
    {
        try
        {
            if (!NotificationRuleContracts.ParseChannels(dto.ChannelsJson).Contains(NotificationChannels.Webhook))
            {
                return true;
            }

            var configuration = NotificationRuleContracts.ParseConfiguration(dto.ConfigurationJson);
            return Uri.TryCreate(configuration.WebhookUrl, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp);
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
