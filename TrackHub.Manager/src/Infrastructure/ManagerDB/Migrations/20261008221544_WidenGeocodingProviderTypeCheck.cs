using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Manager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class WidenGeocodingProviderTypeCheck : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_geocoding_providers_type",
                schema: "map",
                table: "geocoding_providers");

            migrationBuilder.AlterColumn<short>(
                name: "type",
                schema: "map",
                table: "geocoding_providers",
                type: "smallint",
                nullable: false,
                comment: "Geocoding backend this provider row configures. Values: 1=Nominatim, 2=OpenRouteService, 3=Google, 4=Local.",
                oldClrType: typeof(short),
                oldType: "smallint",
                oldComment: "Geocoding backend this provider row configures. Values: 1=Nominatim, 2=OpenRouteService, 3=Google.");

            migrationBuilder.AddCheckConstraint(
                name: "ck_geocoding_providers_type",
                schema: "map",
                table: "geocoding_providers",
                sql: "type in (1, 2, 3, 4)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "ck_geocoding_providers_type",
                schema: "map",
                table: "geocoding_providers");

            migrationBuilder.AlterColumn<short>(
                name: "type",
                schema: "map",
                table: "geocoding_providers",
                type: "smallint",
                nullable: false,
                comment: "Geocoding backend this provider row configures. Values: 1=Nominatim, 2=OpenRouteService, 3=Google.",
                oldClrType: typeof(short),
                oldType: "smallint",
                oldComment: "Geocoding backend this provider row configures. Values: 1=Nominatim, 2=OpenRouteService, 3=Google, 4=Local.");

            migrationBuilder.AddCheckConstraint(
                name: "ck_geocoding_providers_type",
                schema: "map",
                table: "geocoding_providers",
                sql: "type in (1, 2, 3)");
        }
    }
}
