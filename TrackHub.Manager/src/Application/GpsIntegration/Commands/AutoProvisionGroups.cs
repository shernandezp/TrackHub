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

using Common.Application.Paging;

namespace TrackHub.Manager.Application.GpsIntegration.Commands;

// Where an auto-provisioned transporter must land so the account can actually see it. Placing it in
// the default group unconditionally gives an account whose users sit in another group a clean sync
// and a permanently empty live map, with no error anywhere.
internal readonly record struct AutoProvisionGroupTarget(IReadOnlyCollection<long> GroupIds, bool Ambiguous);

internal readonly record struct AutoAssignOutcome(int Provisioned, bool Ambiguous);

internal static class AutoProvisionGroups
{
    public static async Task<AutoProvisionGroupTarget> ResolveAsync(
        IGroupReader groupReader,
        IGroupWriter groupWriter,
        Guid accountId,
        CancellationToken cancellationToken)
    {
        var withUsers = await groupReader.GetGroupIdsWithUsersAsync(accountId, cancellationToken);

        // One user-bearing group is unambiguous — put the unit where the users are. With several,
        // picking one would be a guess: fall back to the default group and let the caller report it.
        if (withUsers.Count == 1)
        {
            return new AutoProvisionGroupTarget(withUsers, Ambiguous: false);
        }

        var defaultGroupId = await ResolveDefaultGroupIdAsync(groupReader, groupWriter, accountId, cancellationToken);
        return new AutoProvisionGroupTarget([defaultGroupId], Ambiguous: withUsers.Count > 1);
    }

    // Search by name rather than scanning the account's groups: the account read is paged, and a
    // scan of page 1 would miss an existing default group and create a duplicate every sync.
    private static async Task<long> ResolveDefaultGroupIdAsync(
        IGroupReader groupReader,
        IGroupWriter groupWriter,
        Guid accountId,
        CancellationToken cancellationToken)
    {
        var groups = await groupReader.GetGroupsByAccountAsync(
            accountId, 0, PageRequest.MaxPageSize, GroupMetadata.DefaultGroupName, cancellationToken);
        var existing = groups.Items.FirstOrDefault(g =>
            string.Equals(g.Name, GroupMetadata.DefaultGroupName, StringComparison.OrdinalIgnoreCase));
        if (existing.GroupId != 0)
        {
            return existing.GroupId;
        }

        var created = await groupWriter.CreateGroupAsync(
            new GroupDto(GroupMetadata.DefaultGroupName, GroupMetadata.DefaultGroupDescription, Active: true),
            accountId,
            cancellationToken);
        return created.GroupId;
    }
}
