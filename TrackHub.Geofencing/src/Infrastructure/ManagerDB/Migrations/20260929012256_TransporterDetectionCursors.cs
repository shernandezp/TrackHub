using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Geofencing.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TransporterDetectionCursors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "transporter_detection_cursors",
                schema: "geofencing",
                columns: table => new
                {
                    transporterid = table.Column<Guid>(type: "uuid", nullable: false),
                    accountid = table.Column<Guid>(type: "uuid", nullable: false),
                    lastfixat = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transporter_detection_cursors", x => x.transporterid);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "transporter_detection_cursors",
                schema: "geofencing");
        }
    }
}
