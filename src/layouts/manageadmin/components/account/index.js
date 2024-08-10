import { useState } from 'react';
import TableAccordion from "controls/Accordions/TableAccordion";
import Table from "controls/Tables/Table";
import DefaultDialog from "controls/Dialogs/DefaultDialog";
import CustomTextField from 'controls/Dialogs/CustomTextField';
import useForm from 'controls/Dialogs/useForm';

import useAccountTableData from "layouts/manageadmin/data/accountTableData";

function ManageAccount() {

  const handleRowClick = (rowData) => {
    setValues(rowData);
  };

  const [expanded, setExpanded] = useState(false);
  const { data: accountsData, open, handleSave, setOpen } = useAccountTableData(expanded, handleRowClick);
  const [values, handleChange, setValues] = useForm({ name: '', description: '' });

  const { columns, rows } = accountsData;

  return (
    <>
      <TableAccordion 
        title="Account" 
        expanded={expanded} 
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <DefaultDialog 
          title="Account Details"
          handleSave={async() => await handleSave(values)}
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
            value={values.name}
            onChange={handleChange}
          />
          
          <CustomTextField
            margin="normal"
            name="description"
            id="description"
            label="Description"
            type="text"
            fullWidth
            value={values.description}
            onChange={handleChange}
          />
        </form>
      </DefaultDialog>
    </>
  );
}

export default ManageAccount;
