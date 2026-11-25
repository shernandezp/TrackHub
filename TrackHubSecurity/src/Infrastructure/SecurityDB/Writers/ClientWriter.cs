// Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

using Common.Application.Exceptions;
using Common.Domain.Extensions;
using TrackHub.Security.Domain.Records;
using TrackHub.Security.Infrastructure.Interfaces;

namespace TrackHub.Security.Infrastructure.Writers;

public sealed class ClientWriter(IApplicationDbContext context) : IClientWriter
{
    public async Task<ClientVm> CreateClientAsync(ClientDto clientDto, byte[] salt, string key, CancellationToken cancellationToken)
    {
        // Client name is the identity used by IsValidClientAsync / service permissions; a duplicate is a
        // conflict (409), not a masked 500 from the unique-index violation at SaveChanges.
        if (await context.Clients.AnyAsync(c => c.Name == clientDto.Name, cancellationToken))
        {
            throw new ConflictException($"A client named '{clientDto.Name}' already exists.");
        }

        var client = new Client(
            clientDto.Name,
            clientDto.UserId,
            clientDto.Description,
            clientDto.Secret.EncryptData(key, salt),
            Convert.ToBase64String(salt),
            false);

        await context.Clients.AddAsync(client, cancellationToken);

        await context.SaveChangesAsync(cancellationToken);

        return new ClientVm(
            client.ClientId,
            client.UserId,
            client.Name,
            client.Description,
            clientDto.Secret,
            client.Processed,
            client.LastModified);
    }

    public async Task UpdateClientAsync(ClientUserDto clientUserDto, CancellationToken cancellationToken)
    {
        var client = await context.Clients.FindAsync([clientUserDto.ClientId], cancellationToken)
            ?? throw new NotFoundException(nameof(Client), $"{clientUserDto.ClientId}");

        context.Clients.Attach(client);
        client.UserId = clientUserDto.UserId;

        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteClientAsync(Guid clientId, CancellationToken cancellationToken)
    {
        var client = await context.Clients.FindAsync([clientId], cancellationToken)
            ?? throw new NotFoundException(nameof(Client), $"{clientId}");

        context.Clients.Attach(client);
        context.Clients.Remove(client);

        await context.SaveChangesAsync(cancellationToken);
    }
}
