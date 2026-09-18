using Common.Domain.Constants;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TrackHub.Telemetry.Infrastructure.TelemetryDB.Entities;

namespace TrackHub.Telemetry.Infrastructure.Configurations;

public class TransporterPositionHistoryConfiguration : IEntityTypeConfiguration<TransporterPositionHistory>
{
    public void Configure(EntityTypeBuilder<TransporterPositionHistory> builder)
    {
        // Telemetry schema: append-heavy history is isolated from the app schema so a
        // future Positions/Telemetry service extraction is a schema handover, not a hunt.
        builder.ToTable(name: TableMetadata.TransporterPositionHistory, schema: SchemaMetadata.Telemetry);
        builder.Property(x => x.TransporterPositionHistoryId).HasColumnName("id");
        builder.Property(x => x.AccountId).HasColumnName("accountid");
        builder.Property(x => x.OperatorId).HasColumnName("operatorid");
        builder.Property(x => x.DeviceId).HasColumnName("deviceid");
        builder.Property(x => x.TransporterId).HasColumnName("transporterid");
        builder.Property(x => x.SourceTimestamp).HasColumnName("sourcetimestamp");
        builder.Property(x => x.ReceivedAt).HasColumnName("receivedat");
        builder.Property(x => x.Latitude).HasColumnName("latitude");
        builder.Property(x => x.Longitude).HasColumnName("longitude");
        builder.Property(x => x.Altitude).HasColumnName("altitude");
        builder.Property(x => x.Speed).HasColumnName("speed");
        builder.Property(x => x.Course).HasColumnName("course");
        builder.Property(x => x.EventId).HasColumnName("eventid");
        builder.Property(x => x.Address).HasColumnName("address").HasMaxLength(ColumnMetadata.DefaultAddressLength);
        builder.Property(x => x.City).HasColumnName("city").HasMaxLength(ColumnMetadata.DefaultNameLength);
        builder.Property(x => x.State).HasColumnName("state").HasMaxLength(ColumnMetadata.DefaultNameLength);
        builder.Property(x => x.Country).HasColumnName("country").HasMaxLength(ColumnMetadata.DefaultNameLength);
        builder.Property(x => x.Attributes).HasColumnName("attributes").HasColumnType(ColumnMetadata.TextField);
        builder.Property(x => x.IdempotencyKey).HasColumnName("idempotencykey").HasMaxLength(ColumnMetadata.DefaultTokenLength).IsRequired();

        builder.HasIndex(e => new { e.AccountId, e.SourceTimestamp }).IsDescending(false, true);
        builder.HasIndex(e => new { e.AccountId, e.TransporterId, e.SourceTimestamp });
        builder.HasIndex(e => new { e.AccountId, e.DeviceId, e.SourceTimestamp });
        // Both keys carry the partition key: PostgreSQL requires every unique constraint on a
        // partitioned table to include it. The idempotency guarantee is therefore per-partition —
        // the same key redelivered in a different month is no longer rejected by the database, which
        // is why the ingest probe below is time-bounded rather than open-ended.
        builder.HasKey(e => new { e.TransporterPositionHistoryId, e.SourceTimestamp });
        builder.HasIndex(e => new { e.IdempotencyKey, e.SourceTimestamp }).IsUnique();
    }
}
