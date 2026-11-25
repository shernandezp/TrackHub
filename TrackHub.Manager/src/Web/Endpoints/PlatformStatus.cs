using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;
using TrackHub.Manager.Domain.Interfaces;

namespace TrackHub.Manager.Web.Endpoints;

/// <summary>
/// REST rather than GraphQL on purpose: the mediator pipeline's behaviors all assume a principal, and
/// there is none on this anonymous surface, so it calls the reader directly.
/// </summary>
public sealed class PlatformStatus : Common.Web.Infrastructure.EndpointGroupBase
{
    public const string CachePolicy = "platform-announcements";

    public const string RateLimitPolicy = "platform-announcements";

    public override void Map(WebApplication app)
        => app.MapGet("~/api/PlatformStatus/announcements", GetAnnouncements)
            .AllowAnonymous()
            .CacheOutput(CachePolicy)
            .RequireRateLimiting(RateLimitPolicy);

    public static async Task<IResult> GetAnnouncements(IPlatformAnnouncementReader reader, CancellationToken cancellationToken)
    {
        var announcements = await reader.GetVisiblePlatformAnnouncementsAsync(DateTimeOffset.UtcNow, cancellationToken);

        // Deliberately narrow: Active/LastModified stay internal.
        return Results.Ok(announcements.Select(x => new
        {
            id = x.PlatformAnnouncementId,
            messageEn = x.MessageEn,
            messageEs = x.MessageEs,
            severity = x.Severity.ToString(),
            startsAt = x.StartsAt,
            endsAt = x.EndsAt
        }));
    }
}
