import { useState } from 'react';
import TableAccordion from "controls/Accordions/TableAccordion";
import Table from "controls/Tables/Table";
import DefaultDialog from "controls/Dialogs/DefaultDialog";
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useForm from 'controls/Dialogs/useForm';
import protocolTypes from 'layouts/manageadmin/data/protocolTypes';

import useOperatorTableData from "layouts/manageadmin/data/operatorsTableData";

function ManageOperators() {

  const handleEditClick = (rowData) => {
    setValues(rowData);
  };

  const handleAddClick = () => {
    setValues({protocolTypeId: 0});
  };

  const [expanded, setExpanded] = useState(false);
  const { data: operatorsData, open, handleSave, setOpen } = useOperatorTableData(expanded, handleEditClick);
  const [values, handleChange, setValues] = useForm({});

  const { columns, rows } = operatorsData;

  return (
    <>
      <TableAccordion 
        title="Operators" 
        showAddIcon={true}
        expanded={expanded} 
        setOpen={setOpen} 
        handleAddClick={handleAddClick}
        setExpanded={setExpanded}>
        <Table columns={columns} rows={rows} />
      </TableAccordion>

      <DefaultDialog 
          title="Operator Details"
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
            value={values.name || ''}
            onChange={handleChange}
          />
          
          <CustomTextField
            margin="normal"
            name="description"
            id="description"
            label="Description"
            type="text"
            fullWidth
            value={values.description || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="phoneNumber"
            id="phoneNumber"
            label="Phone Number"
            type="text"
            fullWidth
            value={values.phoneNumber || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="emailAddress"
            id="emailAddress"
            label="Email Address"
            type="email"
            fullWidth
            value={values.emailAddress || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="address"
            id="address"
            label="Address"
            type="text"
            fullWidth
            value={values.address || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="contactName"
            id="contactName"
            label="Contact Name"
            type="text"
            fullWidth
            value={values.contactName || ''}
            onChange={handleChange}
          />

          <CustomSelect
            list={protocolTypes}
            handleChange={handleChange}
            name="protocolTypeId"
            id="protocolTypeId"
            label="Protocol Type"
            value={values.protocolTypeId}
          />
          
        </form>
      </DefaultDialog>
    </>
  );
}

export default ManageOperators;
