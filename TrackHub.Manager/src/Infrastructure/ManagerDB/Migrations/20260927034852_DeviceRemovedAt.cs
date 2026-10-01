using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Manager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class DeviceRemovedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // A database that ran an earlier copy of UserReplicaRole already has the column.
            migrationBuilder.Sql("ALTER TABLE app.devices ADD COLUMN IF NOT EXISTS removedat timestamp with time zone;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "removedat",
                schema: "app",
                table: "devices");
        }
    }
}
