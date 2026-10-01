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
using TrackHub.Manager.Domain.Constants;
using TrackHub.Manager.Domain.Interfaces;
using TrackHub.Manager.Infrastructure;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.ManagerDB.Jobs;

namespace Infrastructure.UnitTests;

[TestFixture]
public class DocumentScanStoreTests
{
    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    [Test]
    public async Task AVerdictForASupersededVersion_StaysOnThatVersion()
    {
        await using var context = NewContext(nameof(AVerdictForASupersededVersion_StaysOnThatVersion));
        var accountId = Guid.NewGuid();
        var document = new Document(accountId, DocumentOwnerTypes.Transporter, Guid.NewGuid().ToString(), "User", "u", "local", "key-2", "application/pdf", 10, "h2",
            DocumentClassifications.Internal, DocumentStatuses.Uploaded, null, "Owner", DocumentScanStatuses.Quarantined, "a.pdf", "SOAT") { CurrentVersion = 2 };
        context.Documents.Add(document);
        context.DocumentVersions.Add(new DocumentVersion(document.DocumentId, accountId, 1, "local", "key-1", "h1", 10, "application/pdf", "a.pdf", DocumentScanStatuses.Quarantined, null, null, null, DateTimeOffset.UtcNow.AddMinutes(-2)));
        context.DocumentVersions.Add(new DocumentVersion(document.DocumentId, accountId, 2, "local", "key-2", "h2", 10, "application/pdf", "a.pdf", DocumentScanStatuses.Quarantined, null, null, null, DateTimeOffset.UtcNow));
        await context.SaveChangesAsync();
        var store = new DocumentScanStore(context);

        var queue = await store.GetQuarantinedAsync(10, CancellationToken.None);
        var first = queue.Single(q => q.VersionNumber == 1);
        await store.ApplyScanResultAsync(first, new DocumentScanOutcome(DocumentScanStatuses.Clean, true, false), "scan:v1", DateTimeOffset.UtcNow, CancellationToken.None);

        var reloaded = await context.Documents.AsNoTracking().SingleAsync();
        var versions = await context.DocumentVersions.AsNoTracking().OrderBy(v => v.VersionNumber).ToListAsync();
        Assert.Multiple(() =>
        {
            Assert.That(queue.Select(q => q.StorageKey), Is.EquivalentTo(new[] { "key-1", "key-2" }));
            Assert.That(versions[0].ScanStatus, Is.EqualTo(DocumentScanStatuses.Clean));
            Assert.That(versions[1].ScanStatus, Is.EqualTo(DocumentScanStatuses.Quarantined));
            Assert.That(reloaded.ScanStatus, Is.EqualTo(DocumentScanStatuses.Quarantined), "the current version is still unscanned");
            Assert.That(reloaded.Status, Is.EqualTo(DocumentStatuses.Uploaded));
        });
    }
}
