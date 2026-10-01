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

using TrackHub.Manager.Application.Transporters.Commands.Delete;
using TrackHub.Manager.Domain.Interfaces;

namespace Application.UnitTests.Transporters;

[TestFixture]
public class DeleteTransporterCommandHandlerTests
{
    [Test]
    public async Task Handle_RetiresTheTransporter()
    {
        var writer = new Mock<ITransporterWriter>();
        var transporterId = Guid.NewGuid();

        await new DeleteTransporterCommandHandler(writer.Object).Handle(new DeleteTransporterCommand(transporterId), CancellationToken.None);

        writer.Verify(w => w.RetireTransporterAsync(transporterId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
