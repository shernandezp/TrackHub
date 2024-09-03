import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import AccountFormDialog from 'layouts/systemadmin/components/accounts/AccountsDialog';
import UserFormDialog from 'layouts/manageadmin/components/users/UserDialog';
import useForm from 'controls/Dialogs/useForm';
import useAccountsTableData from 'layouts/systemadmin/data/accountsTableData';

function ManageAccounts() {
  const { t } = useTranslation();
  const handleAddClick = () => {
    setAccountValues({active: true, typeId: 0});
    setAccountErrors({});
  };

  const handleEditClick = (rowData) => {
    setAccountValues(rowData);
    setAccountErrors({});
  };

  const handleAddManagerClick = (accountId) => {
    setUserValues({active: true, accountId: accountId});
    setUserErrors({});
  };

  const [expanded, setExpanded] = useState(false);
  const { 
    data, 
    open,
    openUser,
    onSave, 
    onSaveUser,
    setOpen,
    setOpenUser} = useAccountsTableData(expanded, handleEditClick, handleAddManagerClick);

  const requiredAccountFields = ['name', 'typeId'];
  const requiredUserFields = ['emailAddress', 'firstName', 'lastName', 'password'];
  const [accountValues, handleAccountChange, setAccountValues, setAccountErrors, validateAccount, accountErrors] = useForm({}, requiredAccountFields);
  const [userValues, handleUserChange, setUserValues, setUserErrors, validateUser, userErrors] = useForm({}, requiredUserFields);
  const { columns, rows } = data;

  const handleSubmit = async () => {
    if (validateAccount()) {
      onSave(accountValues);
    }
  };

  const handleSubmitUser = async () => {
    if (validateUser()) {
      onSaveUser(userValues);
    }
  };

  return (
    <>
      <TableAccordion 
        title={t('account.title')}
        showAddIcon={true}
        expanded={expanded} 
        setOpen={setOpen} 
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <AccountFormDialog 
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={accountValues}
        handleChange={handleAccountChange}
        errors={accountErrors}
      />

      <UserFormDialog 
        open={openUser}
        setOpen={setOpenUser}
        handleSubmit={handleSubmitUser}
        values={userValues}
        handleChange={handleUserChange}
        errors={userErrors}
      />
    </>
  );
}

export default ManageAccounts;