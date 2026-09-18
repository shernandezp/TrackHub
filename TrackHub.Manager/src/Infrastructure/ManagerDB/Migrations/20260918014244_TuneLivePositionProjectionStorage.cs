using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Manager.Infrastructure.Migrations
{
    /// <summary>
    /// Storage tuning for the live-position projection: one row per vehicle, rewritten on every sync
    /// cycle and never grown. At the default fillfactor almost no update is HOT, so each one rewrites
    /// every index entry too and leaves a dead tuple behind — measured 0.5 % HOT and a 20x size
    /// increase over 30 simulated minutes. Leaving 30 % of each page free lets the new tuple stay on
    /// its own page, and the aggressive autovacuum settings reclaim it before the table can bloat.
    /// </summary>
    public partial class TuneLivePositionProjectionStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                ALTER TABLE telemetry.transporter_position SET (
                    fillfactor = 70,
                    autovacuum_vacuum_scale_factor = 0.02,
                    autovacuum_vacuum_threshold = 50,
                    autovacuum_analyze_scale_factor = 0.05,
                    autovacuum_vacuum_cost_delay = 0)
                """);

            // fillfactor only governs pages written from here on, so the already-bloated heap has to
            // be rewritten once for it to mean anything. One row per vehicle: the exclusive lock is
            // sub-second, and the next sync cycle refreshes the projection regardless.
            migrationBuilder.Sql("VACUUM (FULL, ANALYZE) telemetry.transporter_position", suppressTransaction: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
            => migrationBuilder.Sql(
                """
                ALTER TABLE telemetry.transporter_position RESET (
                    fillfactor,
                    autovacuum_vacuum_scale_factor,
                    autovacuum_vacuum_threshold,
                    autovacuum_analyze_scale_factor,
                    autovacuum_vacuum_cost_delay)
                """);
    }
}
