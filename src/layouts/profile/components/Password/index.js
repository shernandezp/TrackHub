import React from "react";
import PropTypes from "prop-types";
import CustomPasswordField from "controls/Dialogs/CustomPasswordField";
import FormDialog from "controls/Dialogs/FormDialog";
import { useTranslation } from "react-i18next";

function PasswordChangeForm({ open, setOpen, handleSubmit, values, handleChange, errors }) {
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
                name="password"
                id="password"
                label={t("user.password")}
                fullWidth
                value={values.password || ''}
                onChange={handleChange}
                errorMsg={errors.password}/>
            <CustomPasswordField
                name="confirmPassword"
                id="confirmPassword"
                label={t("user.confirmPassword")}
                fullWidth
                value={values.confirmPassword || ''}
                onChange={handleChange}
                errorMsg={errors.confirmPassword}/>
        </form>
    </FormDialog>
  );
}

PasswordChangeForm.propTypes = {
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired,
    handleSubmit: PropTypes.func.isRequired,
    values: PropTypes.object.isRequired,
    handleChange: PropTypes.func.isRequired,
    errors: PropTypes.object.isRequired,
};

export default PasswordChangeForm;