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
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace TrackHub.Security.Infrastructure.Configurations;

public sealed class OutboxMessageConfiguration : IEntityTypeConfiguration<OutboxMessage>
{
    public void Configure(EntityTypeBuilder<OutboxMessage> builder)
    {
        builder.ToTable(name: TableMetadata.OutboxMessage, schema: SchemaMetadata.Security);

        builder.Property(x => x.OutboxMessageId).HasColumnName("id");
        builder.Property(x => x.Sequence).HasColumnName("sequence").ValueGeneratedOnAdd().UseIdentityByDefaultColumn();
        builder.Property(x => x.OrderingKey).HasColumnName("orderingkey").HasMaxLength(100);
        builder.Property(x => x.MessageType).HasColumnName("messagetype").HasMaxLength(60).IsRequired();
        builder.Property(x => x.PayloadJson).HasColumnName("payloadjson").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").HasMaxLength(20).IsRequired();
        builder.Property(x => x.AttemptCount).HasColumnName("attemptcount");
        builder.Property(x => x.NextAttemptAt).HasColumnName("nextattemptat");
        builder.Property(x => x.LastError).HasColumnName("lasterror").HasMaxLength(2000);
        builder.Property(x => x.CreatedAt).HasColumnName("createdat");
        builder.Property(x => x.ProcessedAt).HasColumnName("processedat");

        // The dispatcher scans pending work in creation order.
        builder.HasIndex(x => new { x.Status, x.Sequence });
    }
}
