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

using Common.Domain.Constants;
using TrackHub.Manager.Domain.Constants;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Jobs;

public sealed class DocumentExpirationStore(IApplicationDbContext context) : IDocumentExpirationStore
{
    private const string JobKey = BackgroundJobKeys.DocumentExpiration;

    public async Task<IReadOnlyCollection<ExpiringDocumentVm>> GetExpiringAsync(
        IReadOnlyCollection<Guid> accountIds, DateTimeOffset horizon, CancellationToken cancellationToken)
        => await context.Documents
            .Where(d => accountIds.Contains(d.AccountId)
                && d.Status == DocumentStatuses.Active
                && d.ExpiresAt != null
                && d.ExpiresAt <= horizon)
            .Select(d => new ExpiringDocumentVm(d.DocumentId, d.AccountId, d.Category, d.ExpiresAt!.Value))
            .ToListAsync(cancellationToken);

    public async Task<bool> JobRunSucceededAsync(string idempotencyKey, CancellationToken cancellationToken)
        => await context.BackgroundJobRuns.AnyAsync(
            r => r.JobKey == JobKey && r.IdempotencyKey == idempotencyKey && r.Status == "Succeeded", cancellationToken);

    public async Task CompleteAsync(
        Guid documentId, Guid accountId, bool markExpired, string idempotencyKey,
        DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        context.ChangeTracker.Clear();

        if (markExpired)
        {
            var document = await context.Documents
                .AsTracking().FirstOrDefaultAsync(d => d.DocumentId == documentId, cancellationToken);
            if (document is not null && document.Status == DocumentStatuses.Active)
            {
                document.Status = DocumentStatuses.Expired;
            }
        }

        context.BackgroundJobRuns.Add(new BackgroundJobRun(
            JobKey, accountId, documentId.ToString(), idempotencyKey, "Succeeded", 1, startedAt)
        {
            CompletedAt = DateTimeOffset.UtcNow,
        });

        await context.SaveChangesAsync(cancellationToken);
    }
}
