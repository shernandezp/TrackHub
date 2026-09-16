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

using Common.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TrackHub.Security.Domain.Interfaces;
using TrackHub.Security.Domain.Records;
using System.Text.Json;
using TrackHub.Security.Domain.Constants;

namespace TrackHub.Security.Application.Audit.Events;

// Builds the audit notification from the current principal so handlers stay one-liners.
public static class SecurityAudit
{
    public static SecurityAuditForwarder.Notification Event(
        ICurrentPrincipal principal,
        string action,
        string resourceType,
        string resourceId,
        Guid? accountId,
        string? oldValues = null,
        string? newValues = null)
    {
        var actorId = principal.UserId?.ToString()
            ?? principal.ClientId
            ?? principal.SubjectId
            ?? "unknown";

        return new SecurityAuditForwarder.Notification(new SecurityAuditEventDto(
            accountId,
            principal.PrincipalType.ToString(),
            actorId,
            action,
            resourceType,
            resourceId,
            oldValues,
            newValues,
            principal.CorrelationId));
    }
}

// Records a security audit event for forwarding to Manager. Recorded rather than sent inline: the
// outbound writer acquires the security_client token synchronously, so a missing identity or a
// Manager outage would otherwise cost the audit row entirely.
public sealed class SecurityAuditForwarder
{
    public readonly record struct Notification(SecurityAuditEventDto AuditEvent) : INotification
    {
        public class EventHandler(IOutboxWriter outbox, ILogger<EventHandler> logger) : INotificationHandler<Notification>
        {
            public async Task Handle(Notification notification, CancellationToken cancellationToken)
            {
                try
                {
                    await outbox.EnqueueAsync(
                        OutboxMessageTypes.AuditEvent,
                        JsonSerializer.Serialize(notification.AuditEvent),
                        // Audit rows are independent of each other: no ordering key, so one stuck
                        // user mirror never holds up the audit trail.
                        null,
                        cancellationToken);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(
                        ex,
                        "Failed to record security audit event {Action} on {ResourceType} {ResourceId}; the originating command still succeeded. Payload account={AccountId} actor={ActorId}.",
                        notification.AuditEvent.Action,
                        notification.AuditEvent.ResourceType,
                        notification.AuditEvent.ResourceId,
                        notification.AuditEvent.AccountId,
                        notification.AuditEvent.ActorId);
                }
            }
        }
    }
}
