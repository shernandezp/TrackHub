using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Geofencing.Infrastructure.Migrations
{
    public partial class GeofenceEventAlertMarkers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "entryalertedat",
                schema: "geofencing",
                table: "geofenceevents",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "exitalertedat",
                schema: "geofencing",
                table: "geofenceevents",
                type: "timestamp with time zone",
                nullable: true);

            // Visits recorded before the markers existed were alerted by the old fire-and-forget path.
            migrationBuilder.Sql("UPDATE geofencing.geofenceevents SET entryalertedat = datetime, exitalertedat = departuretimestamp;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "entryalertedat",
                schema: "geofencing",
                table: "geofenceevents");

            migrationBuilder.DropColumn(
                name: "exitalertedat",
                schema: "geofencing",
                table: "geofenceevents");
        }
    }
}
