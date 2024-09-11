import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import FormDialog from "controls/Dialogs/FormDialog";
import CustomCheckbox from 'controls/Dialogs/CustomCheckbox';
import CustomTextField from 'controls/Dialogs/CustomTextField';

function GroupFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }) {
  const { t } = useTranslation();
  return (
    <FormDialog 
          title={t('group.details')}
          handleSave={handleSubmit}
          open={open}
          setOpen={setOpen}
          maxWidth="md">
        <form>

          <CustomTextField
            margin="normal"
            name="name"
            id="name"
            label={t('group.name')}
            type="text"
            fullWidth
            value={values.name || ''}
            onChange={handleChange}
            errorMsg={errors.name}
            required
          />

          <CustomTextField
            margin="normal"
            name="description"
            id="description"
            label={t('group.description')}
            type="text"
            fullWidth
            value={values.description || ''}
            onChange={handleChange}
            errorMsg={errors.description}
            required
          />
          
          <CustomCheckbox 
            name="active" 
            id="active" 
            value={values.active} 
            handleChange={handleChange} 
            label={t('group.active')} />

        </form>
      </FormDialog>
  );
}

GroupFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
};

export default GroupFormDialog;