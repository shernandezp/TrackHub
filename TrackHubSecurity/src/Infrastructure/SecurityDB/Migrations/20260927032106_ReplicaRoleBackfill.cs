using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Security.Infrastructure.Migrations
{
    /// <summary>
    /// Manager's user replica now carries the effective role. Every existing user is re-mirrored
    /// through the outbox so the replica is complete before the first alert fan-out consults it.
    /// </summary>
    public partial class ReplicaRoleBackfill : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO security.outbox_messages (id, orderingkey, messagetype, payloadjson, status, attemptcount, nextattemptat, createdat)
                SELECT gen_random_uuid(),
                       u.id::text,
                       'UserUpdated',
                       jsonb_build_object(
                           'UserId', u.id,
                           'User', jsonb_build_object('UserId', u.id, 'Username', u.username, 'Active', u.active, 'Role', r.name, 'AccountId', u.accountid))::text,
                       'Pending',
                       0,
                       now(),
                       now()
                FROM security.users u
                LEFT JOIN LATERAL (
                    SELECT ro.name
                    FROM security.user_role ur
                    JOIN security.roles ro ON ro.id = ur.roleid
                    WHERE ur.userid = u.id
                    ORDER BY ur.roleid
                    LIMIT 1) r ON TRUE;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
