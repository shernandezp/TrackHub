using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Security.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ResourceActionGrantUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM security.resource_action_role r USING security.resource_action_role k
                WHERE r.resourceid = k.resourceid AND r.actionid = k.actionid AND r.roleid = k.roleid AND r.id > k.id;

                DELETE FROM security.resource_action_policy r USING security.resource_action_policy k
                WHERE r.resourceid = k.resourceid AND r.actionid = k.actionid AND r.policyid = k.policyid AND r.id > k.id;
                """);

            migrationBuilder.DropIndex(
                name: "IX_resource_action_role_resourceid_actionid",
                schema: "security",
                table: "resource_action_role");

            migrationBuilder.DropIndex(
                name: "IX_resource_action_policy_resourceid_actionid",
                schema: "security",
                table: "resource_action_policy");

            migrationBuilder.CreateIndex(
                name: "ux_resource_action_role_grant",
                schema: "security",
                table: "resource_action_role",
                columns: new[] { "resourceid", "actionid", "roleid" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_resource_action_policy_grant",
                schema: "security",
                table: "resource_action_policy",
                columns: new[] { "resourceid", "actionid", "policyid" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ux_resource_action_role_grant",
                schema: "security",
                table: "resource_action_role");

            migrationBuilder.DropIndex(
                name: "ux_resource_action_policy_grant",
                schema: "security",
                table: "resource_action_policy");

            migrationBuilder.CreateIndex(
                name: "IX_resource_action_role_resourceid_actionid",
                schema: "security",
                table: "resource_action_role",
                columns: new[] { "resourceid", "actionid" });

            migrationBuilder.CreateIndex(
                name: "IX_resource_action_policy_resourceid_actionid",
                schema: "security",
                table: "resource_action_policy",
                columns: new[] { "resourceid", "actionid" });
        }
    }
}
