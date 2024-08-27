import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import FormDialog from "controls/Dialogs/FormDialog";
import CustomPasswordField from 'controls/Dialogs/CustomPasswordField';

function PasswordFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }) {
  const { t } = useTranslation();
  return (
    <FormDialog 
          title={t('user.updatePassword')}
          handleSave={handleSubmit}
          open={open}
          setOpen={setOpen}
          maxWidth="md">
        <form>
          <CustomPasswordField
            margin="normal"
            name="password"
            id="password"
            label={t('user.password')}
            fullWidth
            value={values.password || ''}
            onChange={handleChange}
            errorMsg={errors.password}
          />
        </form>
      </FormDialog>
  );
}

PasswordFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
};

export default PasswordFormDialog;