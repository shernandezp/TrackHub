using Common.Application.Exceptions;
using Common.Application.Interfaces;
using Common.Domain.Constants;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Writers;

public sealed class PublicLinkGrantWriter(IApplicationDbContext context, ICurrentPrincipal principal) : AccountScopedDataAccess(context, principal), IPublicLinkGrantWriter
{
    public const string ExpiryTooLongCode = "PUBLIC_LINK_EXPIRY_TOO_LONG";
    private const string MaxExpiryDaysKey = "maxExpiryDays";
    private const int DefaultMaxExpiryDays = 90;

    public async Task<PublicLinkGrantVm> CreatePublicLinkGrantAsync(PublicLinkGrantDto publicLinkGrant, CancellationToken cancellationToken)
    {
        var accountId = RequireAccountWriteAccess(publicLinkGrant.AccountId);
        await RequireExpiryWithinCapAsync(accountId, publicLinkGrant.ExpiresAt, cancellationToken);

        var token = GeneratePublicLinkToken();
        var entity = new PublicLinkGrant(accountId, publicLinkGrant.ResourceType, publicLinkGrant.ResourceId, publicLinkGrant.Scopes, publicLinkGrant.Purpose, PublicLinkTokenHasher.Hash(token), publicLinkGrant.ExpiresAt, ActorOf(publicLinkGrant.CreatedByPrincipalId));
        await Context.PublicLinkGrants.AddAsync(entity, cancellationToken);
        AddAuditEvent(entity.AccountId, "CreatePublicLinkGrant", "PublicLinkGrant", entity.PublicLinkGrantId.ToString(), null, AuditValues(entity));
        await Context.SaveChangesAsync(cancellationToken);
        return ToVm(entity, token);
    }

    private async Task RequireExpiryWithinCapAsync(Guid accountId, DateTimeOffset expiresAt, CancellationToken cancellationToken)
    {
        var configuration = await Context.AccountFeatures
            .Where(x => x.AccountId == accountId && x.FeatureKey == FeatureKeys.PublicLinks)
            .Select(x => x.ConfigurationJson)
            .FirstOrDefaultAsync(cancellationToken);
        var maxDays = MaxExpiryDays(configuration);

        if (expiresAt > DateTimeOffset.UtcNow.AddDays(maxDays))
        {
            throw new ValidationException(ExpiryTooLongCode,
                [new FluentValidation.Results.ValidationFailure(nameof(PublicLinkGrantDto.ExpiresAt), $"A public link may live at most {maxDays} days.")]);
        }
    }

    // Unreadable configuration falls back to the default cap rather than lifting it.
    private static int MaxExpiryDays(string? configurationJson)
    {
        if (string.IsNullOrWhiteSpace(configurationJson))
        {
            return DefaultMaxExpiryDays;
        }

        try
        {
            using var document = JsonDocument.Parse(configurationJson);
            return document.RootElement.ValueKind == JsonValueKind.Object
                && document.RootElement.TryGetProperty(MaxExpiryDaysKey, out var value)
                && value.TryGetInt32(out var days)
                    ? Math.Clamp(days, 1, 365)
                    : DefaultMaxExpiryDays;
        }
        catch (JsonException)
        {
            return DefaultMaxExpiryDays;
        }
    }

    public async Task RevokePublicLinkGrantAsync(Guid publicLinkGrantId, string? revokedBy, CancellationToken cancellationToken)
    {
        var entity = await RequireScopedAsync(Context.PublicLinkGrants.AsTracking(), x => x.PublicLinkGrantId == publicLinkGrantId, x => x.AccountId, publicLinkGrantId, forWrite: true, cancellationToken);
        var oldValues = AuditValues(entity);
        entity.RevokedAt = DateTimeOffset.UtcNow;
        entity.RevokedBy = ActorOf(revokedBy);
        AddAuditEvent(entity.AccountId, "RevokePublicLinkGrant", "PublicLinkGrant", entity.PublicLinkGrantId.ToString(), oldValues, AuditValues(entity));
        await Context.SaveChangesAsync(cancellationToken);
    }

    // RecordPublicLinkAccessAsync removed — see PublicLinkGrantResolver, which is now the only place
    // that increments AccessCount, stamps LastAccessedAt and writes the `PublicLinkAccessed` audit
    // event (spec 11 §7.8/§18.10).

    private static PublicLinkGrantVm ToVm(PublicLinkGrant x, string? token = null) 
        => new(x.PublicLinkGrantId, x.AccountId, x.ResourceType, x.ResourceId, x.Scopes, x.Purpose, x.ExpiresAt, x.RevokedAt, x.RevokedBy, x.CreatedByPrincipalId, x.AccessCount, x.LastAccessedAt, x.LastModified, token);

    private static string GeneratePublicLinkToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    // resourceType, resourceId, scopes and purpose are caller-supplied free text on create.
    private static string AuditValues(PublicLinkGrant grant)
        => $$"""{"resourceType":{{Quote(grant.ResourceType)}},"resourceId":{{Quote(grant.ResourceId)}},"scopes":{{Quote(grant.Scopes)}},"purpose":{{Quote(grant.Purpose)}},"expiresAt":{{Quote(grant.ExpiresAt)}},"revokedAt":{{Quote(grant.RevokedAt)}},"revokedBy":{{Quote(grant.RevokedBy)}},"accessCount":{{grant.AccessCount}},"lastAccessedAt":{{Quote(grant.LastAccessedAt)}}}""";

}
