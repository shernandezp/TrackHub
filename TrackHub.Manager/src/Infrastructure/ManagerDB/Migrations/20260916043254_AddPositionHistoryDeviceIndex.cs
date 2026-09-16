using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Manager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPositionHistoryDeviceIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_alert_events_deduplicationkey",
                schema: "app",
                table: "alert_events");

            migrationBuilder.CreateIndex(
                name: "IX_transporter_position_history_accountid_deviceid_sourcetimes~",
                schema: "telemetry",
                table: "transporter_position_history",
                columns: new[] { "accountid", "deviceid", "sourcetimestamp" });

            migrationBuilder.CreateIndex(
                name: "ix_alert_events_open_dedup",
                schema: "app",
                table: "alert_events",
                columns: new[] { "accountid", "deduplicationkey" },
                unique: true,
                filter: "status <> 'Resolved'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_transporter_position_history_accountid_deviceid_sourcetimes~",
                schema: "telemetry",
                table: "transporter_position_history");

            migrationBuilder.DropIndex(
                name: "ix_alert_events_open_dedup",
                schema: "app",
                table: "alert_events");

            migrationBuilder.CreateIndex(
                name: "IX_alert_events_deduplicationkey",
                schema: "app",
                table: "alert_events",
                column: "deduplicationkey");
        }
    }
}
