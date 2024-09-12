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
  const [userId, setUserId] = useState('');

  const columns = [
    { field: 'username', headerName: t('user.username') }
  ];

  const reloadData = async () => {
    const users = await getUsersByAccount();
    const assignedUsers = await getUsersByPolicy(policyId);
    const unassignedUsers = users.filter(user => !assignedUsers.some(assignedUser => assignedUser.userId === user.userId));
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
    selectedRows.forEach(async(index) => {
      await deleteUserPolicy(data[index].userId, policyId);
    });
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