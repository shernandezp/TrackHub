import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import FormDialog from "controls/Dialogs/FormDialog";
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomPasswordField from 'controls/Dialogs/CustomPasswordField';

function CredentialFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }) {
  const { t } = useTranslation();
  return (
    <FormDialog 
          title={t('credential.title')}
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
            label={t('credential.username')}
            type="text"
            fullWidth
            value={values.username || ''}
            onChange={handleChange}
          />

          <CustomPasswordField
            margin="normal"
            name="password"
            id="password"
            label={t('credential.password')}
            fullWidth
            value={values.password || ''}
            onChange={handleChange}
          />

          <CustomPasswordField
            margin="normal"
            name="key"
            id="key"
            label={t('credential.key')}
            fullWidth
            value={values.key || ''}
            onChange={handleChange}
          />

          <CustomPasswordField
            margin="normal"
            name="key2"
            id="key2"
            label={t('credential.key2')}
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