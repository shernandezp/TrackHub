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

namespace TrackHub.Manager.Application.Transporters.Commands.Restore;

[Authorize(Resource = Resources.Transporters, Action = Actions.Delete)]
// Enforcement: the writer loads the transporter and checks its owning account (RequireRowAccess).
[AccountScopeEnforcedInHandler]
public record RestoreTransporterCommand(Guid Id) : IRequest;

public class RestoreTransporterCommandHandler(ITransporterWriter writer) : IRequestHandler<RestoreTransporterCommand>
{
    public async Task Handle(RestoreTransporterCommand request, CancellationToken cancellationToken)
        => await writer.RestoreTransporterAsync(request.Id, cancellationToken);
}
