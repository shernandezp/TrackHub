using Common.Infrastructure;
using GraphQL;
using TrackHub.Security.Domain.Models;
using TrackHub.Security.Domain.Interfaces;
using TrackHub.Security.Domain.Records;
using Common.Application.Interfaces;
using Common.Domain.Constants;

namespace TrackHub.Security.Infrastructure.ManagerApi;

// The user replica is dispatched from the outbox loop, outside any HTTP request, so the
// calls run under security_client rather than a propagated caller token (which does not exist there).
public class ManagerWriter(IGraphQLClientFactory graphQLClient)
    : GraphQLService(graphQLClient.CreateClient(Clients.Manager, asService: true)), IManagerWriter
{
    // Single source of truth for the mutations this writer sends; the
    // ServiceContracts tests validate these exact strings against the Manager schema.
    internal const string CreateUserMutation = @"
                    mutation($accountId: UUID!, $active: Boolean!, $userId: UUID!, $username: String!, $role: String) {
                      createUser(command: { user: { accountId: $accountId, active: $active, userId: $userId, username: $username, role: $role } }) {
                        userId
                      }
                    }";

    internal const string UpdateUserMutation = @"
                    mutation($id:UUID!, $active: Boolean!, $userId: UUID!, $username: String!, $role: String) {
                      updateUser(id: $id,
                            command: { user: { active: $active, userId: $userId, username: $username, role: $role } })
                    }";

    internal const string DeleteUserMutation = @"
                    mutation($id:UUID!) {
                      deleteUser(id: $id)
                    }";

    // Creates a new user asynchronously.
    public async Task<UserShrankVm> CreateUserAsync(UserShrankDto user, CancellationToken token)
    {
        var request = new GraphQLRequest
        {
            Query = CreateUserMutation,
            Variables = new
            {
                user.AccountId,
                // Mirror the Security row's real state: hard-coding false left the app.users
                // replica invisible to the vw_users views (WHERE active) until an update ran.
                active = user.Active,
                user.UserId,
                user.Username,
                user.Role
            }
        };
        var result = await MutationAsync<UserShrankVm>(request, token);
        return result;
    }

    // Updates an existing user asynchronously.
    public async Task<bool> UpdateUserAsync(Guid id, UpdateUserShrankDto user, CancellationToken token)
    {
        var request = new GraphQLRequest
        {
            Query = UpdateUserMutation,
            Variables = new
            {
                id,
                user.Active,
                user.UserId,
                user.Username,
                user.Role
            }
        };
        var result = await MutationAsync<bool>(request, token);
        return result;
    }

    // Deletes a user asynchronously.
    public async Task<Guid> DeleteUserAsync(Guid id, CancellationToken token)
    {
        var request = new GraphQLRequest
        {
            Query = DeleteUserMutation,
            Variables = new
            {
                id
            }
        };
        var result = await MutationAsync<Guid>(request, token);
        return result;
    }
}
