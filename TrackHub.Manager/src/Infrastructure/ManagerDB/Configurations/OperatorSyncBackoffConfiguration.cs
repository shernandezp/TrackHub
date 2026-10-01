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
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrackHub.Manager.Infrastructure.Entities;

namespace TrackHub.Manager.Infrastructure.Configurations;

public sealed class OperatorSyncBackoffConfiguration : IEntityTypeConfiguration<OperatorSyncBackoff>
{
    public void Configure(EntityTypeBuilder<OperatorSyncBackoff> builder)
    {
        builder.ToTable(
            name: TableMetadata.OperatorSyncBackoff,
            schema: SchemaMetadata.Application,
            t => t.HasCheckConstraint("ck_operator_sync_backoffs_consecutivefailures", "consecutivefailures > 0"));

        builder.HasKey(x => x.OperatorId);
        builder.Property(x => x.OperatorId).HasColumnName("operatorid");
        builder.Property(x => x.ConsecutiveFailures).HasColumnName("consecutivefailures");
        builder.Property(x => x.RetryAt).HasColumnName("retryat");

        builder.HasOne<Operator>()
            .WithOne()
            .HasForeignKey<OperatorSyncBackoff>(x => x.OperatorId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
