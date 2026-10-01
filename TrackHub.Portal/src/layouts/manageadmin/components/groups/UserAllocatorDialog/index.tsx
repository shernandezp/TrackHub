/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

import { useEffect, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import DynamicTableDialog from 'controls/Dialogs/TableDialogs/DynamicTableDialog';
import SearchSelect from 'edition/SearchSelect';
import type { SearchOption } from 'edition/SearchSelect';
import { excludingOptions, useAccountUserOptions } from 'edition/pickerOptions';
import { useUsersByGroup, groupKeys } from 'queries/groups';
import { createUserGroup, deleteUserGroup } from 'api/manager/groups';
import { notifyApiError } from 'api/core/errors';
import { LoadingContext } from 'LoadingContext';

interface UserAllocatorDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  groupId: number;
}

function UserAllocatorDialog({ open, setOpen, groupId }: UserAllocatorDialogProps) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const queryClient = useQueryClient();
  const [user, setUser] = useState<SearchOption | null>(null);

  // Group membership is drained to exhaustion so the server-searched picker can hide every
  // current member; it is invalidated after each add/remove.
  const assignedUsersQuery = useUsersByGroup(open ? groupId : undefined);
  const data = assignedUsersQuery.data ?? [];
  const useAvailableUserOptions = useMemo(
    () => excludingOptions(useAccountUserOptions, new Set(data.map((assigned) => assigned.userId))),
    [data]
  );

  const columns = [
    { field: 'username', headerName: t('user.username') }
  ];

  const reloadData = async () => {
    await queryClient.invalidateQueries({ queryKey: groupKeys.usersByGroup(groupId) });
    setUser(null);
  };

  // Keep the global spinner UX while the membership list loads.
  useEffect(() => {
    setLoading(assignedUsersQuery.isFetching);
  }, [assignedUsersQuery.isFetching, setLoading]);

  const handleAdd = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // createUserGroup surfaces failures via the global toast (legacy handleError).
      await createUserGroup(user.value, groupId);
    } catch (e) {
      notifyApiError(e);
    }
    await reloadData();
    setLoading(false);
  };

  const handleDelete = async (selectedRows: number[]) => {
    setLoading(true);
    // deleteUserGroup keeps the legacy silent semantics (handleSilentError).
    const deletePromises = selectedRows.map(index =>
      deleteUserGroup(data[index].userId, groupId).catch(() => undefined));
    await Promise.all(deletePromises);
    await reloadData();
    setLoading(false);
  };

  const handleClose = async () => {
    setUser(null);
    setOpen(false);
  };

  return (
    <DynamicTableDialog
      title={t('group.assignUser')}
      handleAdd={handleAdd}
      handleDelete={handleDelete}
      handleClose={handleClose}
      open={open}
      data={data}
      columns={columns}>
      <SearchSelect
        id="userId"
        label={t('user.singleTitle')}
        value={user?.value ?? null}
        valueLabel={user?.label}
        onChange={setUser}
        useOptions={useAvailableUserOptions}
      />
    </DynamicTableDialog>
  );
}

export default UserAllocatorDialog;
