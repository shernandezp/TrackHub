import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import FormDialog from "controls/Dialogs/FormDialog";
import CustomSelect from 'controls/Dialogs/CustomSelect';
import CustomTextField from 'controls/Dialogs/CustomTextField';
import CustomCheckbox from 'controls/Dialogs/CustomCheckbox';
import CustomPasswordField from 'controls/Dialogs/CustomPasswordField';
import accountTypes from 'layouts/systemadmin/data/accountTypes';

function AccountsFormDialog({ open, setOpen, handleSubmit, values, handleChange, errors }) {
  const { t } = useTranslation();
  return (
    <FormDialog 
          title={t('account.details')}
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
            label={t('account.name')}
            type="text"
            fullWidth
            value={values.name || ''}
            onChange={handleChange}
            errorMsg={errors.name}
            required
          />
          
          <CustomTextField
            margin="dense"
            name="description"
            id="description"
            label={t('account.description')}
            type="text"
            fullWidth
            value={values.description || ''}
            onChange={handleChange}
          />

          {!values.accountId && (
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
                errorMsg={errors.emailAddress}
            />
          )}
          {!values.accountId && (
            <CustomPasswordField
                margin="normal"
                name="password"
                id="password"
                label={t('user.password')}
                fullWidth
                value={values.password || ''}
                onChange={handleChange}
            />
          )}
          {!values.accountId && (
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
          )}
          {!values.accountId && (
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
          )}

          <CustomSelect
            list={accountTypes}
            handleChange={handleChange}
            name="typeId"
            id="typeId"
            label={t('account.type')}
            value={values.typeId}
            required
          />
          {errors.typeId && <p>{errors.typeId}</p>}

          <CustomCheckbox 
            name="active" 
            id="active" 
            value={values.active} 
            handleChange={handleChange} 
            label={t('account.active')} />
            
        </form>
      </FormDialog>
  );
}

AccountsFormDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
};

export default AccountsFormDialog;