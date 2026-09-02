using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Manager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAccountTimeZone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "timezoneid",
                schema: "app",
                table: "accounts",
                type: "character varying(64)",
                maxLength: 64,
                nullable: false,
                defaultValue: "UTC",
                comment: "IANA time zone the account keeps its calendar in.");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "timezoneid",
                schema: "app",
                table: "accounts");
        }
    }
}
