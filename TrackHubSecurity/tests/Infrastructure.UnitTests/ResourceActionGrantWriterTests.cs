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

using Microsoft.EntityFrameworkCore;
using TrackHub.Security.Domain.Records;
using TrackHub.Security.Infrastructure;
using TrackHub.Security.Infrastructure.Writers;

namespace Infrastructure.UnitTests;

[TestFixture]
public class ResourceActionGrantWriterTests
{
    private static ApplicationDbContext NewContext(string name)
        => new(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(name).UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking).Options);

    [Test]
    public async Task GrantingTwice_KeepsOneRow_SoOneRevokeRemovesTheGrant()
    {
        using var context = NewContext(nameof(GrantingTwice_KeepsOneRow_SoOneRevokeRemovesTheGrant));
        var roles = new ResourceActionRoleWriter(context);
        var policies = new ResourceActionPolicyWriter(context);

        await roles.CreateResourceActionRoleAsync(new ResourceActionRoleDto(1, 1, 2), CancellationToken.None);
        await roles.CreateResourceActionRoleAsync(new ResourceActionRoleDto(1, 1, 2), CancellationToken.None);
        await policies.CreateResourceActionPolicyAsync(new ResourceActionPolicyDto(1, 1, 3), CancellationToken.None);
        await policies.CreateResourceActionPolicyAsync(new ResourceActionPolicyDto(1, 1, 3), CancellationToken.None);
        await policies.DeleteResourceActionPolicyAsync(1, 1, 3, CancellationToken.None);

        Assert.Multiple(() =>
        {
            Assert.That(context.ResourceActionRole.Count(), Is.EqualTo(1));
            Assert.That(context.ResourceActionPolicy.Any(), Is.False);
        });
    }
}
