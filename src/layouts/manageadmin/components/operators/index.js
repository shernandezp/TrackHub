import { useState } from 'react';
import TableAccordion from "controls/Accordions/TableAccordion";
import Table from "controls/Tables/Table";
import FormDialog from "controls/Dialogs/FormDialog";
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import useForm from 'controls/Dialogs/useForm';
import protocolTypes from 'layouts/manageadmin/data/protocolTypes';
import ConfirmDialog from 'controls/Dialogs/ConfirmDialog';
import useOperatorTableData from "layouts/manageadmin/data/operatorsTableData";

function ManageOperators() {

  const handleAddClick = () => {
    setValues({protocolTypeId: 0});
  };

  const handleEditClick = (rowData) => {
    setValues(rowData);
  };

  const handleDeleteClick = (operatorId) => {
    setToDelete(operatorId);
  };

  const [expanded, setExpanded] = useState(false);
  const { data: operatorsData, open, confirmOpen, onSave, onDelete, setOpen, setConfirmOpen } 
    = useOperatorTableData(expanded, handleEditClick, handleDeleteClick);
  const [values, handleChange, setValues] = useForm({});
  const [toDelete, setToDelete] = useState(null);

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

      <FormDialog 
          title="Operator Details"
          handleSave={async() => await onSave(values)}
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
      </FormDialog>
      <ConfirmDialog 
        title="Delete Operator"
        message="Are you sure you want to delete this operator?"
        open={confirmOpen} 
        setOpen={setConfirmOpen} 
        onConfirm={async() => await onDelete(toDelete)} />
    </>
  );
}

export default ManageOperators;
