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

import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import DynamicTableDialog from 'controls/Dialogs/TableDialogs/DynamicTableDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import { useUsersByAccount } from 'queries/users';
import useGroupService from 'services/groups';
import { LoadingContext } from 'LoadingContext';

function UserAllocatorDialog({ open, setOpen, groupId }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { createUserGroup, deleteUserGroup, getUsersByGroup } = useGroupService();
  const [data, setData] = useState([]);
  const [userId, setUserId] = useState('');

  // Account users come from the security query layer; group membership stays on
  // the (not-yet-migrated) group service.
  const accountUsersQuery = useUsersByAccount({ enabled: open });
  const accountUsers = accountUsersQuery.data ?? [];

  const columns = [
    { field: 'username', headerName: t('user.username') }
  ];

  const users = accountUsers
    .filter(user => !data.some(assignedUser => assignedUser.userId === user.userId))
    .map(user => ({
      value: user.userId,
      label: user.username
    }));

  const reloadData = async () => {
    const assignedUsers = await getUsersByGroup(groupId);
    setData(assignedUsers);
    setUserId('');
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await reloadData();
      } finally {
        setLoading(false);
      }
    };
    if (open)
        fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Keep the global spinner UX while the account-user list loads.
  useEffect(() => {
    setLoading(accountUsersQuery.isFetching);
  }, [accountUsersQuery.isFetching, setLoading]);

  const handleChange = (event) => {
    setLoading(true);
    setUserId(event.target.value);
    setLoading(false);
  };

  const handleAdd = async () => {
    setLoading(true);
    await createUserGroup(userId, groupId);
    await reloadData();
    setLoading(false);
  };

  const handleDelete = async (selectedRows) => {
    setLoading(true);
    const deletePromises = selectedRows.map(index => deleteUserGroup(data[index].userId, groupId));
    await Promise.all(deletePromises);
    await reloadData();
    setLoading(false);
  };

  const handleClose = async () => {
    setUserId('');
    setData([]);
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
      <CustomSelect
        list={users}
        name="userId"
        id="userId"
        label={t('user.singleTitle')}
        value={userId}
        handleChange={handleChange}
        numericValue={false}
        required
      />
    </DynamicTableDialog>
  );
}

UserAllocatorDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    groupId: PropTypes.number.isRequired
};

export default UserAllocatorDialog;
