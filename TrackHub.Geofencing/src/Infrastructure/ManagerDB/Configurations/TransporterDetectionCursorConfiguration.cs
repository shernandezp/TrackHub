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

namespace TrackHub.Geofencing.Infrastructure.Configurations;

public sealed class TransporterDetectionCursorConfiguration : IEntityTypeConfiguration<TransporterDetectionCursor>
{
    public void Configure(EntityTypeBuilder<TransporterDetectionCursor> builder)
    {
        builder.ToTable(name: TableMetadata.TransporterDetectionCursor, schema: SchemaMetadata.Geofencing);

        builder.HasKey(x => x.TransporterId);
        builder.Property(x => x.TransporterId).HasColumnName("transporterid");
        builder.Property(x => x.AccountId).HasColumnName("accountid");
        builder.Property(x => x.LastFixAt).HasColumnName("lastfixat");
    }
}
