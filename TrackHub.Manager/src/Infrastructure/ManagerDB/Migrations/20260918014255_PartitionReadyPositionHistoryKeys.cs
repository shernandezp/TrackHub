using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Manager.Infrastructure.Migrations
{
    /// <summary>
    /// Both keys of the position-history table gain <c>sourcetimestamp</c>: PostgreSQL requires every
    /// unique constraint on a RANGE-partitioned table to contain the partition key, so this is what
    /// makes the table partitionable. Correct on the unpartitioned table too, which is why it ships
    /// as an ordinary migration and the cutover is a separate, operator-run step.
    /// <para>
    /// Uniqueness on <c>idempotencykey</c> becomes per-partition once the table is split. The ingest
    /// probe is time-bounded to match (see <c>TransporterPositionHistoryWriter</c>).
    /// </para>
    /// </summary>
    public partial class PartitionReadyPositionHistoryKeys : Migration
    {
        private const string Table = "telemetry.transporter_position_history";
        private const string PrimaryKeyName = "PK_transporter_position_history";
        private const string IdempotencyIndex = "IX_transporter_position_history_idempotencykey";
        private const string IdempotencyIndexWithTime = "IX_transporter_position_history_idempotencykey_sourcetimestamp";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Built CONCURRENTLY and swapped in with USING INDEX: the table holds every fix ever
            // recorded, and building a primary key the ordinary way locks ingest out for the whole
            // build rather than for the instant the constraint is exchanged.
            migrationBuilder.Sql(
                $"""
                CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "{PrimaryKeyName}_new"
                    ON {Table} (id, sourcetimestamp)
                """,
                suppressTransaction: true);

            migrationBuilder.Sql(
                $"""
                CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "{IdempotencyIndexWithTime}"
                    ON {Table} (idempotencykey, sourcetimestamp)
                """,
                suppressTransaction: true);

            migrationBuilder.Sql(
                $"""
                ALTER TABLE {Table} DROP CONSTRAINT IF EXISTS "{PrimaryKeyName}";
                ALTER TABLE {Table}
                    ADD CONSTRAINT "{PrimaryKeyName}" PRIMARY KEY USING INDEX "{PrimaryKeyName}_new";
                """);

            migrationBuilder.Sql(
                $"""DROP INDEX CONCURRENTLY IF EXISTS telemetry."{IdempotencyIndex}" """,
                suppressTransaction: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                $"""
                CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "{PrimaryKeyName}_old"
                    ON {Table} (id)
                """,
                suppressTransaction: true);

            migrationBuilder.Sql(
                $"""
                CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS "{IdempotencyIndex}"
                    ON {Table} (idempotencykey)
                """,
                suppressTransaction: true);

            migrationBuilder.Sql(
                $"""
                ALTER TABLE {Table} DROP CONSTRAINT IF EXISTS "{PrimaryKeyName}";
                ALTER TABLE {Table}
                    ADD CONSTRAINT "{PrimaryKeyName}" PRIMARY KEY USING INDEX "{PrimaryKeyName}_old";
                """);

            migrationBuilder.Sql(
                $"""DROP INDEX CONCURRENTLY IF EXISTS telemetry."{IdempotencyIndexWithTime}" """,
                suppressTransaction: true);
        }
    }
}
