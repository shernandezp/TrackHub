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

namespace TrackHub.Manager.Application.GpsIntegration.Commands;

[Authorize(Resource = Resources.SynchronizedDevices, Action = Actions.Write, PrincipalTypes = "ServiceClient")]
[AllowCrossAccount("SyncWorker failure backoff: one global syncworker_client identity schedules every account's operators and persists each operator's retry window so a worker restart keeps it.")]
public readonly record struct SetOperatorSyncBackoffCommand(Guid OperatorId, int ConsecutiveFailures, DateTimeOffset RetryAt) : IRequest<bool>;

public sealed class SetOperatorSyncBackoffCommandValidator : AbstractValidator<SetOperatorSyncBackoffCommand>
{
    public SetOperatorSyncBackoffCommandValidator()
    {
        RuleFor(x => x.OperatorId).NotEmpty();
        RuleFor(x => x.ConsecutiveFailures).GreaterThan(0);
    }
}

public class SetOperatorSyncBackoffCommandHandler(IOperatorWriter writer) : IRequestHandler<SetOperatorSyncBackoffCommand, bool>
{
    public async Task<bool> Handle(SetOperatorSyncBackoffCommand request, CancellationToken cancellationToken)
    {
        await writer.SetSyncBackoffAsync(request.OperatorId, request.ConsecutiveFailures, request.RetryAt, cancellationToken);
        return true;
    }
}

[Authorize(Resource = Resources.SynchronizedDevices, Action = Actions.Write, PrincipalTypes = "ServiceClient")]
[AllowCrossAccount("SyncWorker failure backoff: one global syncworker_client identity clears an operator's retry window after its first successful sync, for whichever account owns the operator.")]
public readonly record struct ClearOperatorSyncBackoffCommand(Guid OperatorId) : IRequest<bool>;

public class ClearOperatorSyncBackoffCommandHandler(IOperatorWriter writer) : IRequestHandler<ClearOperatorSyncBackoffCommand, bool>
{
    public async Task<bool> Handle(ClearOperatorSyncBackoffCommand request, CancellationToken cancellationToken)
    {
        await writer.ClearSyncBackoffAsync(request.OperatorId, cancellationToken);
        return true;
    }
}
