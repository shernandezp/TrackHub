import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Table from "controls/Tables/Table";
import TableAccordion from "controls/Accordions/TableAccordion";
import AccountFormDialog from 'layouts/systemadmin/components/accounts/AccountsDialog';
import useForm from 'controls/Dialogs/useForm';
import useAccountsTableData from 'layouts/systemadmin/data/accountsTableData';

function ManageAccounts() {
  const { t } = useTranslation();
  const handleAddClick = () => {
    setUserValues({active: true, typeId: 0});
    setUserErrors({});
  };

  const handleEditClick = (rowData) => {
    setUserValues(rowData);
    setUserErrors({});
  };

  const [expanded, setExpanded] = useState(false);
  const { 
    data, 
    open, 
    onSave, 
    setOpen} = useAccountsTableData(expanded, handleEditClick);

  const requiredUserFields = ['name', 'typeId'];
  const [userValues, handleUserChange, setUserValues, setUserErrors, validateUser, userErrors] = useForm({}, requiredUserFields);
  const { columns, rows } = data;

  const handleSubmit = async () => {
    if (validateUser()) {
      onSave(userValues);
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
        values={userValues}
        handleChange={handleUserChange}
        errors={userErrors}
      />
    </>
  );
}

export default ManageAccounts;