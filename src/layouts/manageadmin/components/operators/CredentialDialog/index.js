import React from 'react';
import PropTypes from 'prop-types';
import FormDialog from "controls/Dialogs/FormDialog";
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomPasswordField from 'controls/Dialogs/CustomPasswordField';

function CredentialFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }) {

  return (
    <FormDialog 
          title="Credentials"
          handleSave={handleSubmit}
          open={open}
          setOpen={setOpen}
          maxWidth="md">
        <form>
          <CustomTextField
            autoFocus
            margin="dense"
            name="uri"
            id="uri"
            label="URL"
            type="text"
            fullWidth
            value={values.uri || ''}
            onChange={handleChange}
            required
            errorMsg={errors.uri}
          />
          <CustomTextField
            margin="normal"
            name="username"
            id="username"
            label="Username"
            type="text"
            fullWidth
            value={values.username || ''}
            onChange={handleChange}
          />

          <CustomPasswordField
            margin="normal"
            name="password"
            id="password"
            label="Password"
            fullWidth
            value={values.password || ''}
            onChange={handleChange}
          />

          <CustomPasswordField
            margin="normal"
            name="key"
            id="key"
            label="Key"
            fullWidth
            value={values.key || ''}
            onChange={handleChange}
          />

          <CustomPasswordField
            margin="normal"
            name="key2"
            id="key2"
            label="Key 2"
            fullWidth
            value={values.key2 || ''}
            onChange={handleChange}
          />
          
        </form>
      </FormDialog>
  );
}

CredentialFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
};

export default CredentialFormDialog;