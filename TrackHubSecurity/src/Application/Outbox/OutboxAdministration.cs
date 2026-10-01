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

using TrackHub.Security.Domain.Interfaces;
using TrackHub.Security.Domain.Models;

namespace TrackHub.Security.Application.Outbox;

[Authorize(Resource = Resources.Administrative, Action = Actions.Read)]
[PlatformScoped("The Manager-sync outbox is platform plumbing with no tenant dimension, inspected from the Administrator-only console.")]
public readonly record struct GetFailedOutboxMessagesQuery : IRequest<IReadOnlyCollection<FailedOutboxMessageVm>>;

public class GetFailedOutboxMessagesQueryHandler(IOutboxReader reader) : IRequestHandler<GetFailedOutboxMessagesQuery, IReadOnlyCollection<FailedOutboxMessageVm>>
{
    public const int Take = 200;

    public async Task<IReadOnlyCollection<FailedOutboxMessageVm>> Handle(GetFailedOutboxMessagesQuery request, CancellationToken cancellationToken)
        => await reader.GetFailedAsync(Take, cancellationToken);
}

// Null replays every exhausted message; the dispatcher then sends them in their original order.
[Authorize(Resource = Resources.Administrative, Action = Actions.Edit)]
[PlatformScoped("The Manager-sync outbox is platform plumbing with no tenant dimension, replayed from the Administrator-only console.")]
public readonly record struct ReplayFailedOutboxMessagesCommand(Guid? OutboxMessageId) : IRequest<int>;

public class ReplayFailedOutboxMessagesCommandHandler(IOutboxWriter writer) : IRequestHandler<ReplayFailedOutboxMessagesCommand, int>
{
    public async Task<int> Handle(ReplayFailedOutboxMessagesCommand request, CancellationToken cancellationToken)
        => await writer.ReplayFailedAsync(request.OutboxMessageId, cancellationToken);
}

// For a message Manager will always refuse (e.g. a user of an archived account): unblocks its entity.
[Authorize(Resource = Resources.Administrative, Action = Actions.Delete)]
[PlatformScoped("The Manager-sync outbox is platform plumbing with no tenant dimension, cleaned up from the Administrator-only console.")]
public readonly record struct DiscardFailedOutboxMessagesCommand(Guid? OutboxMessageId) : IRequest<int>;

public class DiscardFailedOutboxMessagesCommandHandler(IOutboxWriter writer) : IRequestHandler<DiscardFailedOutboxMessagesCommand, int>
{
    public async Task<int> Handle(DiscardFailedOutboxMessagesCommand request, CancellationToken cancellationToken)
        => await writer.DiscardFailedAsync(request.OutboxMessageId, cancellationToken);
}
