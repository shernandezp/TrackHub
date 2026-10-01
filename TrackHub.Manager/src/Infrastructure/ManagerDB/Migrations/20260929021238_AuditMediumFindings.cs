using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Manager.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AuditMediumFindings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE app.account_features f SET
                    tier = 'trial',
                    effectiveto = LEAST(f.effectiveto, NULLIF(f.configurationjson::jsonb ->> 'trialEndsAt', '')::timestamptz)
                FROM app.accounts a
                WHERE a.id = f.accountid AND a.status = 1 AND f.configurationjson LIKE '%"trialEndsAt"%';

                UPDATE app.account_features SET configurationjson = (configurationjson::jsonb - 'trialEndsAt')::text
                WHERE configurationjson LIKE '%"trialEndsAt"%';
                """);

            migrationBuilder.DropIndex(
                name: "IX_drivers_accountid_documentnumber",
                schema: "app",
                table: "drivers");

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "app",
                table: "transporters",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "retiredat",
                schema: "app",
                table: "transporters",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "requiredgrants",
                schema: "app",
                table: "reports",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "app",
                table: "platform_announcements",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "app",
                table: "operators",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "app",
                table: "notification_templates",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "app",
                table: "notification_rules",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "app",
                table: "groups",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "app",
                table: "drivers",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "app",
                table: "accounts",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "app",
                table: "account_settings",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "app",
                table: "account_features",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "editversion",
                schema: "app",
                table: "account_branding",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.CreateTable(
                name: "operator_sync_backoffs",
                schema: "app",
                columns: table => new
                {
                    operatorid = table.Column<Guid>(type: "uuid", nullable: false),
                    consecutivefailures = table.Column<int>(type: "integer", nullable: false),
                    retryat = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_operator_sync_backoffs", x => x.operatorid);
                    table.CheckConstraint("ck_operator_sync_backoffs_consecutivefailures", "consecutivefailures > 0");
                    table.ForeignKey(
                        name: "FK_operator_sync_backoffs_operators_operatorid",
                        column: x => x.operatorid,
                        principalSchema: "app",
                        principalTable: "operators",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_operator_sync_runs_operatorid_startedat",
                schema: "telemetry",
                table: "operator_sync_runs",
                columns: new[] { "operatorid", "startedat" });

            migrationBuilder.CreateIndex(
                name: "IX_operator_health_checks_operatorid_startedat",
                schema: "telemetry",
                table: "operator_health_checks",
                columns: new[] { "operatorid", "startedat" });

            migrationBuilder.Sql("""
                UPDATE app.drivers SET documentnumber = NULLIF(btrim(documentnumber), '')
                WHERE documentnumber IS NOT NULL AND documentnumber <> btrim(documentnumber) OR documentnumber = '';

                UPDATE app.drivers d SET documentnumber = NULL
                FROM (
                    SELECT id, row_number() OVER (
                        PARTITION BY accountid, documentnumber
                        ORDER BY active DESC, "LastModified" DESC, id) AS rank
                    FROM app.drivers
                    WHERE documentnumber IS NOT NULL
                ) ranked
                WHERE d.id = ranked.id AND ranked.rank > 1;
                """);

            migrationBuilder.CreateIndex(
                name: "ux_drivers_accountid_documentnumber",
                schema: "app",
                table: "drivers",
                columns: new[] { "accountid", "documentnumber" },
                unique: true,
                filter: "documentnumber IS NOT NULL");

            migrationBuilder.Sql("""
                UPDATE app.documents SET classification = CASE lower(btrim(classification))
                    WHEN 'public' THEN 'Public'
                    WHEN 'internal' THEN 'Internal'
                    WHEN 'confidential' THEN 'Confidential'
                    WHEN 'legal' THEN 'Legal'
                    ELSE 'Confidential' END
                WHERE classification IS NULL OR classification NOT IN ('Public', 'Internal', 'Confidential', 'Legal');
                """);

            migrationBuilder.AddCheckConstraint(
                name: "ck_documents_classification",
                schema: "app",
                table: "documents",
                sql: "classification IN ('Public', 'Internal', 'Confidential', 'Legal')");

            migrationBuilder.CreateIndex(
                name: "ix_document_versions_quarantined",
                schema: "app",
                table: "document_versions",
                column: "createdat",
                filter: "scanstatus = 'Quarantined'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "operator_sync_backoffs",
                schema: "app");

            migrationBuilder.DropIndex(
                name: "IX_operator_sync_runs_operatorid_startedat",
                schema: "telemetry",
                table: "operator_sync_runs");

            migrationBuilder.DropIndex(
                name: "IX_operator_health_checks_operatorid_startedat",
                schema: "telemetry",
                table: "operator_health_checks");

            migrationBuilder.DropIndex(
                name: "ux_drivers_accountid_documentnumber",
                schema: "app",
                table: "drivers");

            migrationBuilder.DropCheckConstraint(
                name: "ck_documents_classification",
                schema: "app",
                table: "documents");

            migrationBuilder.DropIndex(
                name: "ix_document_versions_quarantined",
                schema: "app",
                table: "document_versions");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "app",
                table: "transporters");

            migrationBuilder.DropColumn(
                name: "retiredat",
                schema: "app",
                table: "transporters");

            migrationBuilder.DropColumn(
                name: "requiredgrants",
                schema: "app",
                table: "reports");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "app",
                table: "platform_announcements");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "app",
                table: "operators");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "app",
                table: "notification_templates");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "app",
                table: "notification_rules");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "app",
                table: "groups");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "app",
                table: "drivers");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "app",
                table: "accounts");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "app",
                table: "account_settings");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "app",
                table: "account_features");

            migrationBuilder.DropColumn(
                name: "editversion",
                schema: "app",
                table: "account_branding");

            migrationBuilder.CreateIndex(
                name: "IX_drivers_accountid_documentnumber",
                schema: "app",
                table: "drivers",
                columns: new[] { "accountid", "documentnumber" });
        }
    }
}
