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

using System.Threading.Channels;
using TrackHub.Router.Domain.Interfaces;

namespace TrackHub.Router.Infrastructure.Common;

/// <summary>
/// Bounded and in-process, consistent with the single-instance deployment the sync loops already
/// assume. A full queue refuses the trigger rather than dropping it silently.
/// </summary>
public sealed class SyncDispatchQueue : ISyncDispatchQueue
{
    private const int Capacity = 200;

    private readonly Channel<SyncDispatchRequest> _channel =
        Channel.CreateBounded<SyncDispatchRequest>(new BoundedChannelOptions(Capacity)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = true,
        });

    public bool TryEnqueue(SyncDispatchRequest request) => _channel.Writer.TryWrite(request);

    public IAsyncEnumerable<SyncDispatchRequest> ReadAllAsync(CancellationToken cancellationToken)
        => _channel.Reader.ReadAllAsync(cancellationToken);
}
