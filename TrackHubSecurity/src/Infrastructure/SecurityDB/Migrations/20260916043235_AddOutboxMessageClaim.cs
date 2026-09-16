using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Security.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOutboxMessageClaim : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "claimedat",
                schema: "security",
                table: "outbox_messages",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "claimedby",
                schema: "security",
                table: "outbox_messages",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "claimedat",
                schema: "security",
                table: "outbox_messages");

            migrationBuilder.DropColumn(
                name: "claimedby",
                schema: "security",
                table: "outbox_messages");
        }
    }
}
