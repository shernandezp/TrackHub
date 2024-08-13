import { useState } from 'react';
import TableAccordion from "controls/Accordions/TableAccordion";
import Table from "controls/Tables/Table";
import FormDialog from "controls/Dialogs/FormDialog";
import CustomTextField from 'controls/Dialogs/CustomTextField';
import useForm from 'controls/Dialogs/useForm';

import useAccountTableData from "layouts/manageadmin/data/accountTableData";

function ManageAccount() {

  const handleEditClick = (rowData) => {
    setValues(rowData);
    setErrors({});
  };

  const [expanded, setExpanded] = useState(false);
  const { data: accountsData, open, onSave, setOpen } = useAccountTableData(expanded, handleEditClick);
  const requiredFields = ['name'];
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({}, requiredFields);
  const { columns, rows } = accountsData;

  const handleSubmit = async () => {
    if (validate()) {
      onSave(values);
    }
  };

  return (
    <>
      <TableAccordion 
        title="Account" 
        expanded={expanded} 
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <FormDialog 
          title="Account Details"
          handleSave={handleSubmit}
          open={open}
          setOpen={setOpen}
          maxWidth="md">
        <form>
          <CustomTextField
            autoFocus
            margin="dense"
            name="name"
            id="name"
            label="Name"
            type="text"
            fullWidth
            value={values.name || ''}
            onChange={handleChange}
            errorMsg={errors.name}
            required
          />
          
          <CustomTextField
            margin="dense"
            name="description"
            id="description"
            label="Description"
            type="text"
            fullWidth
            value={values.description || ''}
            onChange={handleChange}
          />
        </form>
      </FormDialog>
    </>
  );
}

export default ManageAccount;
