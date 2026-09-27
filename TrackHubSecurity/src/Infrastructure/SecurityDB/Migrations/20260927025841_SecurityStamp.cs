using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Security.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SecurityStamp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "securitystamp",
                schema: "security",
                table: "users",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "securitystamp",
                schema: "security",
                table: "driver_credentials",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "securitystamp",
                schema: "security",
                table: "users");

            migrationBuilder.DropColumn(
                name: "securitystamp",
                schema: "security",
                table: "driver_credentials");
        }
    }
}
