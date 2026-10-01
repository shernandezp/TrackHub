using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TrackHub.Security.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeUserEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$
                DECLARE collision text;
                BEGIN
                    SELECT string_agg(normalized, ', ') INTO collision
                    FROM (
                        SELECT lower(btrim(emailaddress)) AS normalized
                        FROM security.users
                        GROUP BY 1
                        HAVING count(*) > 1
                    ) duplicates;

                    IF collision IS NOT NULL THEN
                        RAISE EXCEPTION 'Users differ only by case or spacing in their email address: %. Resolve them before migrating.', collision;
                    END IF;

                    UPDATE security.users SET emailaddress = lower(btrim(emailaddress))
                    WHERE emailaddress <> lower(btrim(emailaddress));
                END $$;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
