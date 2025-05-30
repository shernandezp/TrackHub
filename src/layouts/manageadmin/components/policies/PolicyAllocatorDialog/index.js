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
import useUserService from 'services/users';
import usePolicyService from 'services/policies';
import { LoadingContext } from 'LoadingContext';

function PolicyAllocatorDialog({ open, setOpen, policyId }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getUsersByAccount } = useUserService();
  const { getUsersByPolicy, createUserPolicy, deleteUserPolicy } = usePolicyService();
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [accountUsers, setAccountUsers] = useState([]);
  const [userId, setUserId] = useState('');

  const columns = [
    { field: 'username', headerName: t('user.username') }
  ];

  const reloadData = async () => {
    const assignedUsers = await getUsersByPolicy(policyId);
    const unassignedUsers = accountUsers.filter(user => !assignedUsers.some(assignedUser => assignedUser.userId === user.userId));
    setUsers(unassignedUsers.map(user => ({
        value: user.userId,
        label: user.username
    })));
    setData(assignedUsers);
    setUserId('');
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const users = await getUsersByAccount();
      setAccountUsers(users);
      await reloadData();
      setLoading(false);
    };
    if (open)
        fetchData();
  }, [open]);

  const handleChange = (event) => {
    setLoading(true);
    setUserId(event.target.value);
    setLoading(false);
  };

  const handleAdd = async () => {
    setLoading(true);
    await createUserPolicy(userId, policyId);
    await reloadData();
    setLoading(false);
  };

  const handleDelete = async (selectedRows) => {
    setLoading(true);
    const deletePromises = selectedRows.map(index => deleteUserPolicy(data[index].userId, policyId));
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
      title={t('policy.assignPolicy')}
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

PolicyAllocatorDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    policyId: PropTypes.number.isRequired
};

export default PolicyAllocatorDialog;