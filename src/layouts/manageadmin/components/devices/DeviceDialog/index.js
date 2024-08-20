import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import FormDialog from "controls/Dialogs/FormDialog";
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import deviceTypes from 'layouts/manageadmin/data/deviceTypes';

function DeviceFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }) {
  const { t } = useTranslation();
  return (
    <FormDialog 
          title={t('device.details')}
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
            label={t('device.name')}
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
            label={t('device.description')}
            type="text"
            fullWidth
            value={values.description || ''}
            onChange={handleChange}
          />

          <CustomSelect
            list={deviceTypes}
            handleChange={handleChange}
            name="deviceTypeId"
            id="deviceTypeId"
            label={t('device.type')}
            value={values.deviceTypeId}
            required
          />
          {errors.deviceTypeId && <p>{errors.deviceTypeId}</p>}
          
        </form>
      </FormDialog>
  );
}

DeviceFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
};

export default DeviceFormDialog;