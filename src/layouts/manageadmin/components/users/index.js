import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import UserFormDialog from 'layouts/manageadmin/components/users/UserDialog';
import PasswordFormDialog from 'layouts/manageadmin/components/users/PasswordDialog';
import useForm from 'controls/Dialogs/useForm';
import ConfirmDialog from 'controls/Dialogs/ConfirmDialog';
import useUserTableData from "layouts/manageadmin/data/usersTableData";

function ManageUsers() {
  const { t } = useTranslation();
  const handleAddClick = () => {
    setUserValues({active: true});
    setUserErrors({});
  };

  const handleEditClick = (rowData) => {
    setUserValues(rowData);
    setUserErrors({});
  };

  const handleUpdatePasswordClick = (rowData) => {
    setPasswordValues(rowData);
    setPasswordErrors({});
  };

  const handleDeleteClick = (userId) => {
    setToDelete(userId);
  };

  const [expanded, setExpanded] = useState(false);
  const { 
    data, 
    open, 
    openPassword, 
    confirmOpen, 
    onSave, 
    onSavePassword, 
    onDelete, 
    setOpen, 
    setOpenPassword, 
    setConfirmOpen} = useUserTableData(expanded, handleEditClick, handleUpdatePasswordClick, handleDeleteClick);

  const [userValues, handleUserChange, setUserValues, setUserErrors, validateUser, userErrors] = useForm({});
  const [passwordValues, handlePasswordChange, setPasswordValues, setPasswordErrors, validatePassword, passwordErrors] = useForm({});
  const [toDelete, setToDelete] = useState(null);
  const { columns, rows } = data;

  const handleSubmit = async () => {
    let requiredFields = userValues.hasOwnProperty('userId') ? 
      ['emailAddress', 'username', 'firstName', 'lastName'] :
      ['emailAddress', 'username', 'firstName', 'lastName', 'password'];

    if (validateUser(requiredFields)) {
      onSave(userValues);
    }
  };

  const handleSubmitPassword = async () => {
    if (validatePassword(['password'])) {
      onSavePassword(passwordValues);
    }
  };

  return (
    <>
      <TableAccordion 
        title={t('user.title')}
        showAddIcon={true}
        expanded={expanded} 
        setOpen={setOpen} 
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <UserFormDialog 
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={userValues}
        handleChange={handleUserChange}
        errors={userErrors}
      />

      <PasswordFormDialog 
        open={openPassword}
        setOpen={setOpenPassword}
        handleSubmit={handleSubmitPassword}
        values={passwordValues}
        handleChange={handlePasswordChange}
        errors={passwordErrors}
      />

      <ConfirmDialog 
        title={t('user.deleteTitle')}
        message={t('user.deleteMessage')}
        open={confirmOpen} 
        setOpen={setConfirmOpen} 
        onConfirm={async() => await onDelete(toDelete)} />
    </>
  );
}

export default ManageUsers;