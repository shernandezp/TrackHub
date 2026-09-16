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
using Common.Domain.Constants;
using Common.Domain.Enums;
using TrackHub.Manager.Infrastructure.Entities;
using TrackHub.Manager.Infrastructure.Interfaces;

namespace TrackHub.Manager.Infrastructure.ManagerDB.Jobs;

public sealed class TrialExpirationStore(IApplicationDbContext context) : ITrialExpirationStore
{
    private const string JobKey = BackgroundJobKeys.TrialExpiration;

    public async Task<IReadOnlyCollection<Guid>> GetTrialAccountsAsync(CancellationToken cancellationToken)
    {
        var trialStatus = (short)AccountStatus.Trial;
        return await context.Accounts
            .Where(a => a.Status == trialStatus)
            .Select(a => a.AccountId)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyCollection<TrialFeatureVm>> GetAccountFeaturesAsync(Guid accountId, CancellationToken cancellationToken)
        => await context.AccountFeatures
            .Where(f => f.AccountId == accountId)
            .Select(f => new TrialFeatureVm(f.Tier, f.EffectiveTo, f.ConfigurationJson))
            .ToListAsync(cancellationToken);

    public async Task<bool> JobRunSucceededAsync(string idempotencyKey, CancellationToken cancellationToken)
        => await context.BackgroundJobRuns.AnyAsync(
            r => r.JobKey == JobKey && r.IdempotencyKey == idempotencyKey && r.Status == "Succeeded", cancellationToken);

    public async Task<bool> SuspendAsync(
        Guid accountId, string reason, string idempotencyKey, DateTimeOffset startedAt, CancellationToken cancellationToken)
    {
        context.ChangeTracker.Clear();

        var account = await context.Accounts.FirstOrDefaultAsync(a => a.AccountId == accountId, cancellationToken);
        if (account is null || (AccountStatus)account.Status != AccountStatus.Trial)
        {
            return false;
        }

        context.Accounts.Attach(account);
        account.Status = (short)AccountStatus.Suspended;
        account.Active = false;
        account.StatusChangedAt = startedAt;

        context.AuditEvents.Add(new AuditEvent(
            accountId, "System", JobKey, "AccountStatusChanged", "Account", accountId.ToString(), "Succeeded",
            JsonSerializer.Serialize(new { status = AccountStatus.Trial.ToString() }),
            JsonSerializer.Serialize(new { status = AccountStatus.Suspended.ToString(), reason }),
            reason, null, null, null));

        context.BackgroundJobRuns.Add(new BackgroundJobRun(
            JobKey, accountId, accountId.ToString(), idempotencyKey, "Succeeded", 1, startedAt)
        {
            CompletedAt = DateTimeOffset.UtcNow,
        });

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task RecordFailureAsync(
        Guid accountId, string idempotencyKey, DateTimeOffset startedAt,
        string errorCode, string errorMessage, CancellationToken cancellationToken)
    {
        context.ChangeTracker.Clear();
        context.BackgroundJobRuns.Add(new BackgroundJobRun(
            JobKey, accountId, accountId.ToString(), idempotencyKey, "Failed", 1, startedAt)
        {
            CompletedAt = DateTimeOffset.UtcNow,
            ErrorCode = errorCode,
            ErrorMessage = errorMessage,
        });
        await context.SaveChangesAsync(cancellationToken);
    }
}
