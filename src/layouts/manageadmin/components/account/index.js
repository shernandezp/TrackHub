import { useState } from 'react';
import TableAccordion from "controls/Accordions/TableAccordion";
import Table from "controls/Tables/Table";
import useForm from 'controls/Dialogs/useForm';
import useAccountTableData from "layouts/manageadmin/data/accountTableData";
import AccountFormDialog from 'layouts/manageadmin/components/account/AccountDialog';
import { useTranslation } from 'react-i18next';

function ManageAccount() {
  const { t } = useTranslation();

  const handleEditClick = (rowData) => {
    setValues(rowData);
    setErrors({});
  };

  const [expanded, setExpanded] = useState(false);
  const { data, open, onSave, setOpen } = useAccountTableData(expanded, handleEditClick);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});
  const { columns, rows } = data;

  const handleSubmit = async () => {
    if (validate(['name'])) {
      onSave(values);
    }
  };

  return (
    <>
      <TableAccordion 
        title={t('account.title')}
        expanded={expanded} 
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <AccountFormDialog 
        open={open}
        setOpen={setOpen}
        handleSubmit={handleSubmit}
        values={values}
        handleChange={handleChange}
        errors={errors}
      />
    </>
  );
}

export default ManageAccount;
