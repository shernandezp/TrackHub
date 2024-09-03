import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import FormDialog from "controls/Dialogs/FormDialog";
import CustomCheckbox from 'controls/Dialogs/CustomCheckbox';
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomPasswordField from 'controls/Dialogs/CustomPasswordField';

function UserFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }) {
  const { t } = useTranslation();
  return (
    <FormDialog 
          title={t('user.details')}
          handleSave={handleSubmit}
          open={open}
          setOpen={setOpen}
          maxWidth="md">
        <form>
          <CustomTextField
            autoFocus
            margin="dense"
            name="emailAddress"
            id="emailAddress"
            label={t('user.emailAddress')}
            type="text"
            fullWidth
            value={values.emailAddress || ''}
            onChange={handleChange}
            required
            errorMsg={errors.emailAddress}
          />

          {!values.userId && (
            <CustomPasswordField
                margin="normal"
                name="password"
                id="password"
                label={t('user.password')}
                fullWidth
                value={values.password || ''}
                onChange={handleChange}
                errorMsg={errors.password}
          />)}

          <CustomTextField
            margin="normal"
            name="username"
            id="username"
            label={t('user.username')}
            type="text"
            fullWidth
            value={values.username || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="firstName"
            id="firstName"
            label={t('user.firstName')}
            type="text"
            fullWidth
            value={values.firstName || ''}
            onChange={handleChange}
            errorMsg={errors.password}
          />

          <CustomTextField
            margin="normal"
            name="secondName"
            id="secondName"
            label={t('user.secondName')}
            type="text"
            fullWidth
            value={values.secondName || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="lastName"
            id="lastName"
            label={t('user.lastName')}
            type="text"
            fullWidth
            value={values.lastName || ''}
            onChange={handleChange}
            errorMsg={errors.password}
          />

          <CustomTextField
            margin="normal"
            name="secondSurname"
            id="secondSurname"
            label={t('user.secondSurname')}
            type="text"
            fullWidth
            value={values.secondSurname || ''}
            onChange={handleChange}
          />

          <CustomTextField
            margin="normal"
            name="dob"
            id="dob"
            label={t('user.dob')}
            type="date"
            fullWidth
            value={values.dob || ''}
            onChange={handleChange}
          />
          
          <CustomCheckbox 
            name="active" 
            id="active" 
            value={values.active} 
            handleChange={handleChange} 
            label={t('user.active')} />

        </form>
      </FormDialog>
  );
}

UserFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
};

export default UserFormDialog;