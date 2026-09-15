using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TrackHub.Security.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class OutboxMessages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "outbox_messages",
                schema: "security",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    sequence = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    orderingkey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    messagetype = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    payloadjson = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    attemptcount = table.Column<int>(type: "integer", nullable: false),
                    nextattemptat = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    lasterror = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    createdat = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    processedat = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outbox_messages", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_outbox_messages_status_sequence",
                schema: "security",
                table: "outbox_messages",
                columns: new[] { "status", "sequence" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "outbox_messages",
                schema: "security");
        }
    }
}
