using Common.Domain.Enums;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;
using Common.Application.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Writers;

// Platform-wide, not account-scoped: see PlatformAnnouncementReader. Write access is restricted to
// the Administrator role by [Authorize(Administrative, Write)] on the commands.
public sealed class PlatformAnnouncementWriter(IApplicationDbContext context, ICurrentPrincipal principal) : IPlatformAnnouncementWriter
{
    public async Task<PlatformAnnouncementVm> CreatePlatformAnnouncementAsync(PlatformAnnouncementDto announcement, CancellationToken cancellationToken)
    {
        var entity = new PlatformAnnouncement(
            announcement.MessageEn, announcement.MessageEs, (int)announcement.Severity,
            announcement.StartsAt, announcement.EndsAt, announcement.Active);

        await context.PlatformAnnouncements.AddAsync(entity, cancellationToken);
        AddAuditEvent("CreatePlatformAnnouncement", entity, null, Describe(entity));
        await context.SaveChangesAsync(cancellationToken);
        return ToVm(entity);
    }

    public async Task UpdatePlatformAnnouncementAsync(Guid platformAnnouncementId, PlatformAnnouncementDto announcement, CancellationToken cancellationToken)
    {
        var entity = await context.PlatformAnnouncements
            .AsTracking().FirstAsync(x => x.PlatformAnnouncementId == platformAnnouncementId, cancellationToken);

        var previous = Describe(entity);
        entity.MessageEn = announcement.MessageEn;
        entity.MessageEs = announcement.MessageEs;
        entity.Severity = (int)announcement.Severity;
        entity.StartsAt = announcement.StartsAt;
        entity.EndsAt = announcement.EndsAt;
        entity.Active = announcement.Active;
        AddAuditEvent("UpdatePlatformAnnouncement", entity, previous, Describe(entity));
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeletePlatformAnnouncementAsync(Guid platformAnnouncementId, CancellationToken cancellationToken)
    {
        var entity = await context.PlatformAnnouncements
            .AsTracking().FirstAsync(x => x.PlatformAnnouncementId == platformAnnouncementId, cancellationToken);
        AddAuditEvent("DeletePlatformAnnouncement", entity, Describe(entity), null);
        context.PlatformAnnouncements.Remove(entity);
        await context.SaveChangesAsync(cancellationToken);
    }

    // Announcements are platform-wide, so the audit row carries the platform account.
    private void AddAuditEvent(string action, PlatformAnnouncement announcement, string? oldValuesJson, string? newValuesJson)
        => context.AuditEvents.Add(AuditTrail.Create(principal, Guid.Empty, action, "PlatformAnnouncement",
            $"{announcement.PlatformAnnouncementId}", oldValuesJson, newValuesJson));

    private static string Describe(PlatformAnnouncement announcement)
        => $$"""{"severity":{{announcement.Severity}},"startsAt":{{AuditJson.Quote(announcement.StartsAt)}},"endsAt":{{AuditJson.Quote(announcement.EndsAt)}},"active":{{announcement.Active.ToString().ToLowerInvariant()}}}""";

    private static PlatformAnnouncementVm ToVm(PlatformAnnouncement x)
        => new(x.PlatformAnnouncementId, x.MessageEn, x.MessageEs, (AnnouncementSeverity)x.Severity, x.StartsAt, x.EndsAt, x.Active, x.LastModified);
}
