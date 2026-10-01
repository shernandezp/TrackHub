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
using Moq;
using TrackHub.Manager.Domain.Constants;
using TrackHub.Manager.Domain.Interfaces;
using TrackHub.Manager.Domain.Records;
using TrackHub.Manager.Infrastructure;
using TrackHub.Manager.Infrastructure.ManagerDB.Writers;

namespace Infrastructure.UnitTests;

// A deleted or voided document must not stay reachable through a public link: its open grants are
// revoked in the same save as the status change, and only Active/Expired documents are servable.
[TestFixture]
public class DocumentShareRevocationTests
{
    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    // The account's own document type the fixtures upload under; uploads outside the account's types are refused.
    private static void SeedDocumentType(ApplicationDbContext context, Guid accountId)
    {
        context.DocumentTypes.Add(new TrackHub.Manager.Infrastructure.Entities.DocumentType(accountId, "SOAT", "SOAT", true, true, 365, true, DateTimeOffset.UtcNow));
        context.SaveChanges();
    }

    private static DocumentWriter Writer(ApplicationDbContext context, Guid accountId)
    {
        var principal = new Mock<ICurrentPrincipal>();
        principal.SetupGet(x => x.AccountId).Returns(accountId);
        principal.SetupGet(x => x.PrincipalType).Returns(PrincipalType.User);
        principal.SetupGet(x => x.UserId).Returns(Guid.NewGuid());
        var policy = new Mock<IDocumentAccessPolicy>();
        policy.SetupGet(p => p.IsPrivilegedPrincipal).Returns(true);
        policy.Setup(p => p.CanAccessOwnerAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        return new DocumentWriter(context, principal.Object, policy.Object, Mock.Of<IAlertRecorder>());
    }

    private static async Task<(Guid DocumentId, PublicLinkGrant Open, PublicLinkGrant Other)> SeedAsync(ApplicationDbContext context, Guid accountId)
    {
        var dto = new DocumentDto(accountId, DocumentOwnerTypes.Transporter, Guid.NewGuid().ToString(), "User", "u", "local", "key", "application/pdf", 10, "hash", DocumentClassifications.Internal, "Active", null, "Owner", "Clean", "soat.pdf", "SOAT");
        var documentId = Guid.NewGuid();
        await Writer(context, accountId).RegisterUploadedDocumentAsync(documentId, dto, CancellationToken.None);
        var open = new PublicLinkGrant(accountId, DocumentSharing.ResourceType, documentId.ToString(), DocumentSharing.ReadScope, "share", "hash", DateTimeOffset.UtcNow.AddDays(1), "u");
        var other = new PublicLinkGrant(accountId, DocumentSharing.ResourceType, Guid.NewGuid().ToString(), DocumentSharing.ReadScope, "share", "hash", DateTimeOffset.UtcNow.AddDays(1), "u");
        await context.PublicLinkGrants.AddRangeAsync(open, other);
        await context.SaveChangesAsync(CancellationToken.None);
        return (documentId, open, other);
    }

    [TestCase("delete")]
    [TestCase("void")]
    public async Task DeleteOrVoid_RevokesTheDocumentsOpenLinks_AndOnlyThose(string action)
    {
        await using var context = NewContext($"{nameof(DeleteOrVoid_RevokesTheDocumentsOpenLinks_AndOnlyThose)}-{action}");
        var accountId = Guid.NewGuid();
        SeedDocumentType(context, accountId);
        var (documentId, open, other) = await SeedAsync(context, accountId);
        var writer = Writer(context, accountId);

        if (action == "delete")
        {
            await writer.DeleteDocumentReferenceAsync(documentId, CancellationToken.None);
        }
        else
        {
            await writer.VoidDocumentAsync(documentId, "superseded", CancellationToken.None);
        }

        var grants = await context.PublicLinkGrants.AsNoTracking().ToListAsync();
        var document = await context.Documents.AsNoTracking().SingleAsync(d => d.DocumentId == documentId);
        Assert.Multiple(() =>
        {
            Assert.That(grants.Single(g => g.PublicLinkGrantId == open.PublicLinkGrantId).RevokedAt, Is.Not.Null);
            Assert.That(grants.Single(g => g.PublicLinkGrantId == other.PublicLinkGrantId).RevokedAt, Is.Null, "another document's link is untouched");
            Assert.That(DocumentStatuses.IsServable(document.Status), Is.False);
        });
    }

    [Test]
    public void OnlyActiveAndExpiredDocumentsAreServable()
    {
        Assert.Multiple(() =>
        {
            Assert.That(DocumentStatuses.IsServable(DocumentStatuses.Active), Is.True);
            Assert.That(DocumentStatuses.IsServable(DocumentStatuses.Expired), Is.True);
            Assert.That(DocumentStatuses.All.Where(s => s is not (DocumentStatuses.Active or DocumentStatuses.Expired)).Any(DocumentStatuses.IsServable), Is.False);
        });
    }
}
