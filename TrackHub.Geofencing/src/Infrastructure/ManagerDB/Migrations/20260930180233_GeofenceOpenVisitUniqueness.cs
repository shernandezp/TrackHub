using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Geofencing.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class GeofenceOpenVisitUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_geofenceevent_open_events",
                schema: "geofencing",
                table: "geofenceevents");

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "geofencing",
                table: "geofences",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            // Only the earliest open visit per unit and zone is real; later ones are closed at their
            // own entry instant with their alerts marked sent, which keeps them as history without a duration.
            migrationBuilder.Sql("""
                UPDATE geofencing.geofenceevents e
                SET departuretimestamp = e.datetime, exitalertedat = e.datetime, entryalertedat = COALESCE(e.entryalertedat, e.datetime)
                WHERE e.departuretimestamp IS NULL
                  AND EXISTS (
                      SELECT 1 FROM geofencing.geofenceevents o
                      WHERE o.transporterid = e.transporterid
                        AND o.geofenceid = e.geofenceid
                        AND o.departuretimestamp IS NULL
                        AND (o.datetime, o.id) < (e.datetime, e.id));
                """);

            migrationBuilder.CreateIndex(
                name: "ux_geofenceevent_open_visit",
                schema: "geofencing",
                table: "geofenceevents",
                columns: new[] { "transporterid", "geofenceid" },
                unique: true,
                filter: "departuretimestamp IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_geofenceevent_open_visit",
                schema: "geofencing",
                table: "geofenceevents");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "geofencing",
                table: "geofences");

            migrationBuilder.CreateIndex(
                name: "ix_geofenceevent_open_events",
                schema: "geofencing",
                table: "geofenceevents",
                columns: new[] { "transporterid", "geofenceid", "departuretimestamp" },
                filter: "departuretimestamp IS NULL");
        }
    }
}
