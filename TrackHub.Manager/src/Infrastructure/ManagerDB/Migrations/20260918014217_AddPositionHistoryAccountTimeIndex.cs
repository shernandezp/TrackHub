using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Manager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPositionHistoryAccountTimeIndex : Migration
    {
        // CONCURRENTLY, outside the migration transaction: the table holds every fix ever recorded,
        // and a plain CREATE INDEX would hold an exclusive lock against the ingest path for the
        // whole build. IF NOT EXISTS makes a retry after an interrupted build safe.
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP INDEX CONCURRENTLY IF EXISTS
                    telemetry."IX_transporter_position_history_accountid_operatorid_sourcetim~";
                """,
                suppressTransaction: true);

            migrationBuilder.Sql(
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS
                    "IX_transporter_position_history_accountid_sourcetimestamp"
                    ON telemetry.transporter_position_history (accountid, sourcetimestamp DESC);
                """,
                suppressTransaction: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP INDEX CONCURRENTLY IF EXISTS
                    telemetry."IX_transporter_position_history_accountid_sourcetimestamp";
                """,
                suppressTransaction: true);

            migrationBuilder.Sql(
                """
                CREATE INDEX CONCURRENTLY IF NOT EXISTS
                    "IX_transporter_position_history_accountid_operatorid_sourcetim~"
                    ON telemetry.transporter_position_history (accountid, operatorid, sourcetimestamp);
                """,
                suppressTransaction: true);
        }
    }
}
