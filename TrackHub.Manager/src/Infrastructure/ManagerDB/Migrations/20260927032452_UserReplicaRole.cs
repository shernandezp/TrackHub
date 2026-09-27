using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Manager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UserReplicaRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_transporter_position_history",
                schema: "telemetry",
                table: "transporter_position_history");

            migrationBuilder.DropIndex(
                name: "IX_transporter_position_history_accountid_operatorid_sourcetim~",
                schema: "telemetry",
                table: "transporter_position_history");

            migrationBuilder.DropIndex(
                name: "IX_transporter_position_history_idempotencykey",
                schema: "telemetry",
                table: "transporter_position_history");

            migrationBuilder.AddColumn<string>(
                name: "role",
                schema: "app",
                table: "users",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "removedat",
                schema: "app",
                table: "devices",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_transporter_position_history",
                schema: "telemetry",
                table: "transporter_position_history",
                columns: new[] { "id", "sourcetimestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_transporter_position_history_accountid_sourcetimestamp",
                schema: "telemetry",
                table: "transporter_position_history",
                columns: new[] { "accountid", "sourcetimestamp" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "IX_transporter_position_history_idempotencykey_sourcetimestamp",
                schema: "telemetry",
                table: "transporter_position_history",
                columns: new[] { "idempotencykey", "sourcetimestamp" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_transporter_position_history",
                schema: "telemetry",
                table: "transporter_position_history");

            migrationBuilder.DropIndex(
                name: "IX_transporter_position_history_accountid_sourcetimestamp",
                schema: "telemetry",
                table: "transporter_position_history");

            migrationBuilder.DropIndex(
                name: "IX_transporter_position_history_idempotencykey_sourcetimestamp",
                schema: "telemetry",
                table: "transporter_position_history");

            migrationBuilder.DropColumn(
                name: "role",
                schema: "app",
                table: "users");

            migrationBuilder.DropColumn(
                name: "removedat",
                schema: "app",
                table: "devices");

            migrationBuilder.AddPrimaryKey(
                name: "PK_transporter_position_history",
                schema: "telemetry",
                table: "transporter_position_history",
                column: "id");

            migrationBuilder.CreateIndex(
                name: "IX_transporter_position_history_accountid_operatorid_sourcetim~",
                schema: "telemetry",
                table: "transporter_position_history",
                columns: new[] { "accountid", "operatorid", "sourcetimestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_transporter_position_history_idempotencykey",
                schema: "telemetry",
                table: "transporter_position_history",
                column: "idempotencykey",
                unique: true);
        }
    }
}
