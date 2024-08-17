import React from 'react';
import PropTypes from 'prop-types';
import FormDialog from "controls/Dialogs/FormDialog";
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import protocolTypes from 'layouts/manageadmin/data/protocolTypes';

function OperatorFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }) {

  return (
    <FormDialog 
          title="Operator Details"
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
            required
            errorMsg={errors.name}
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
            required
          />
          {errors.protocolTypeId && <p>{errors.protocolTypeId}</p>}
          
        </form>
      </FormDialog>
  );
}

OperatorFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
};

export default OperatorFormDialog;