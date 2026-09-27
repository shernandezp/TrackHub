// Copyright (c) 2026 Sergio Hernandez. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License").
//  You may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
//

namespace TrackHub.Manager.Application.Users.Commands.Update;

[Authorize(Resource = Resources.Users, Action = Actions.Edit)]
// The mirror arrives from Security's outbox loop under security_client, a global service
// identity with no account claim; UserWriter.RequireReplicaAccess still scopes the row.
[AllowCrossAccount("Security replicates user changes here from its outbox loop under security_client (no account claim). UserWriter.RequireReplicaAccess checks the replica row's owning account for every other caller.")]
// Enforcement: UserWriter loads the replica row and RequireReplicaAccess checks its owning
// account (same-account / global service / Administrator — Security-parity policy).
[AccountScopeEnforcedInHandler]
public readonly record struct UpdateUserCommand(UpdateUserDto User) : IRequest;

public class UpdateUserCommandHandler(IUserWriter writer) : IRequestHandler<UpdateUserCommand>
{
    public async Task Handle(UpdateUserCommand request, CancellationToken cancellationToken)
        => await writer.UpdateUserAsync(request.User, cancellationToken);
}
