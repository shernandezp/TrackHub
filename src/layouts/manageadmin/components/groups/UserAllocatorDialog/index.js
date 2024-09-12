import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import DynamicTableDialog from 'controls/Dialogs/TableDialogs/DynamicTableDialog';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useUserService from 'services/users';
import useGroupService from 'services/groups';
import { LoadingContext } from 'LoadingContext';

function UserAllocatorDialog({ open, setOpen, groupId }) {
  const { t } = useTranslation();
  const { setLoading } = useContext(LoadingContext);
  const { getUsersByAccount } = useUserService();
  const { createUserGroup, deleteUserGroup, getUsersByGroup } = useGroupService();
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');

  const columns = [
    { field: 'username', headerName: t('user.username') }
  ];

  const reloadData = async () => {
    const users = await getUsersByAccount();
    const assignedUsers = await getUsersByGroup(groupId);
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
    await createUserGroup(userId, groupId);
    await reloadData();
    setLoading(false);
  };

  const handleDelete = async (selectedRows) => {
    setLoading(true);
    selectedRows.forEach(async(index) => {
      await deleteUserGroup(data[index].userId, groupId);
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