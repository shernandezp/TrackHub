using Common.Application.Exceptions;
using Common.Application.Interfaces;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Writers;

public sealed class NotificationTemplateWriter(IApplicationDbContext context, ICurrentPrincipal principal) : AccountScopedDataAccess(context, principal), INotificationTemplateWriter
{
    public async Task<NotificationTemplateVm> CreateNotificationTemplateAsync(NotificationTemplateDto template, CancellationToken cancellationToken)
    {
        RequirePrivileged();
        // Accounts create overrides only; platform defaults are resource-synthesized.
        if (!template.AccountId.HasValue)
        {
            throw new ForbiddenAccessException("Platform default templates are seed data and cannot be created through this surface.");
        }

        var accountId = RequireAccountWriteAccess(template.AccountId.Value);
        var twin = await Context.NotificationTemplates.AsTracking().FirstOrDefaultAsync(x =>
            x.AccountId == accountId
            && x.TemplateKey == template.TemplateKey
            && x.Channel == template.Channel
            && x.Locale == template.Locale, cancellationToken);
        if (twin is { Active: true })
        {
            throw new ConflictException("A template with the same key, channel, and locale already exists.");
        }

        // A deactivated override for the same key, channel and locale is brought back with the new text.
        if (twin is not null)
        {
            var previous = Describe(twin);
            twin.Subject = template.Subject;
            twin.Body = template.Body;
            twin.Active = template.Active;
            AddAuditEvent(accountId, "ReactivateNotificationTemplate", "NotificationTemplate", $"{twin.NotificationTemplateId}", previous, Describe(twin));
            await Context.SaveChangesAsync(cancellationToken);
            return ToVm(twin);
        }


        var entity = new NotificationTemplate(accountId, template.TemplateKey, template.Channel, template.Locale, template.Subject, template.Body, template.Active);
        await Context.NotificationTemplates.AddAsync(entity, cancellationToken);
        AddAuditEvent(accountId, "CreateNotificationTemplate", "NotificationTemplate", $"{entity.NotificationTemplateId}", null, Describe(entity));
        await Context.SaveChangesAsync(cancellationToken);
        return ToVm(entity);
    }

    public async Task UpdateNotificationTemplateAsync(Guid notificationTemplateId, NotificationTemplateDto template, CancellationToken cancellationToken)
    {
        var entity = await LoadAccountOverrideAsync(notificationTemplateId, cancellationToken);
        if (template.AccountId != entity.AccountId)
        {
            throw new ForbiddenAccessException();
        }

        var duplicate = await Context.NotificationTemplates.AnyAsync(x =>
            x.NotificationTemplateId != notificationTemplateId
            && x.AccountId == entity.AccountId
            && x.TemplateKey == template.TemplateKey
            && x.Channel == template.Channel
            && x.Locale == template.Locale, cancellationToken);
        if (duplicate)
        {
            throw new ConflictException("A template with the same key, channel, and locale already exists.");
        }

        var previous = Describe(entity);
        entity.TemplateKey = template.TemplateKey;
        entity.Channel = template.Channel;
        entity.Locale = template.Locale;
        entity.Subject = template.Subject;
        entity.Body = template.Body;
        entity.Active = template.Active;
        AddAuditEvent(entity.AccountId ?? Guid.Empty, "UpdateNotificationTemplate", "NotificationTemplate", $"{entity.NotificationTemplateId}", previous, Describe(entity));
        await Context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteNotificationTemplateAsync(Guid notificationTemplateId, CancellationToken cancellationToken)
    {
        var entity = await LoadAccountOverrideAsync(notificationTemplateId, cancellationToken);
        AddAuditEvent(entity.AccountId ?? Guid.Empty, "DeleteNotificationTemplate", "NotificationTemplate", $"{entity.NotificationTemplateId}", Describe(entity), null);
        Context.NotificationTemplates.Remove(entity);
        await Context.SaveChangesAsync(cancellationToken);
    }

    // Platform defaults are visible to every account, so refusing them discloses nothing; another
    // account's override is answered NotFound.
    private async Task<NotificationTemplate> LoadAccountOverrideAsync(Guid notificationTemplateId, CancellationToken cancellationToken)
    {
        RequirePrivileged();
        var entity = await Context.NotificationTemplates
            .AsTracking().FirstOrDefaultAsync(x => x.NotificationTemplateId == notificationTemplateId, cancellationToken)
            ?? throw new NotFoundException(nameof(NotificationTemplate), notificationTemplateId.ToString());
        if (!entity.AccountId.HasValue)
        {
            throw new ForbiddenAccessException("Platform default templates are read-only to accounts.");
        }

        if (!HasAccountAccess(entity.AccountId.Value, forWrite: true))
        {
            throw new NotFoundException(nameof(NotificationTemplate), notificationTemplateId.ToString());
        }

        return entity;
    }


    private static NotificationTemplateVm ToVm(NotificationTemplate x) => new(x.NotificationTemplateId, x.AccountId, x.TemplateKey, x.Channel, x.Locale, x.Subject, x.Body, x.Active, x.LastModified);
    private static string Describe(NotificationTemplate template)
        => $$"""{"templateKey":{{AuditJson.Quote(template.TemplateKey)}},"channel":{{AuditJson.Quote(template.Channel)}},"locale":{{AuditJson.Quote(template.Locale)}},"active":{{template.Active.ToString().ToLowerInvariant()}}}""";
}
