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

import { useState, useEffect, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DynamicTableDialog from 'controls/Dialogs/TableDialogs/DynamicTableDialog';
import SearchSelect from 'edition/SearchSelect';
import type { SearchOption } from 'edition/SearchSelect';
import { excludingOptions, useAccountUserOptions } from 'edition/pickerOptions';
import { useUsersByRole, useCreateUserRole, useDeleteUserRole } from 'queries/roles';
import { LoadingContext } from 'LoadingContext';

interface RoleAllocatorDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  roleId: number;
}

function RoleAllocatorDialog({ open, setOpen, roleId }: RoleAllocatorDialogProps) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const [user, setUser] = useState<SearchOption | null>(null);

  // Assigned users only matter while the dialog is open; the picker searches the account
  // server-side and hides whoever is already assigned.
  const assignedQuery = useUsersByRole(open ? roleId : undefined);
  const assignedUsers = assignedQuery.data ?? [];
  const createUserRole = useCreateUserRole();
  const deleteUserRole = useDeleteUserRole();
  const useAvailableUserOptions = useMemo(
    () => excludingOptions(useAccountUserOptions, new Set(assignedUsers.map((assigned) => assigned.userId))),
    [assignedUsers]
  );

  const columns = [
    { field: 'username', headerName: t('user.username') }
  ];

  // Keep the global spinner UX while the lists load/refresh.
  useEffect(() => {
    setLoading(assignedQuery.isFetching);
  }, [assignedQuery.isFetching, setLoading]);

  const handleAdd = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await createUserRole.mutateAsync({ userId: user.value, roleId });
      setUser(null);
    } catch {
      // Failure is surfaced by the global toast.
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (selectedRows: number[]) => {
    setLoading(true);
    try {
      const deletePromises = selectedRows.map(index =>
        deleteUserRole.mutateAsync({ userId: assignedUsers[index].userId, roleId }));
      await Promise.all(deletePromises);
      setUser(null);
    } catch {
      // Failure is surfaced by the global toast.
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    setUser(null);
    setOpen(false);
  };

  return (
    <DynamicTableDialog
      title={t('role.assignRole')}
      handleAdd={handleAdd}
      handleDelete={handleDelete}
      handleClose={handleClose}
      open={open}
      data={assignedUsers}
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

export default RoleAllocatorDialog;
