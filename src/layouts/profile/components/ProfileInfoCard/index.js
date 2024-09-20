import { useEffect, useContext } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import ArgonButton from "components/ArgonButton";
import Icon from "@mui/material/Icon";
import CustomTextField from 'controls/Dialogs/CustomTextField';
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import { LoadingContext } from 'LoadingContext';
import { useTranslation } from 'react-i18next';
import useForm from 'controls/Dialogs/useForm';

function ProfileInfoCard({ user, updateCurrentUser }) {
  const { setLoading } = useContext(LoadingContext);
  const { t } = useTranslation();
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});
  
  useEffect(() => {
    const fetchUserInfo = async () => {
      setValues(user);
      setErrors({});
    };
  
    fetchUserInfo();
  }, [user]);

  async function onSaveUser() {
    setLoading(true);
    let requiredFields = ['firstName', 'lastName'];

    if (validate(requiredFields)) {
        await updateCurrentUser(values);
    }
    setLoading(false);
  }

  return (
    <Card sx={{ height: "100%" }}>
      <ArgonBox display="flex" justifyContent="space-between" alignItems="center" pt={2} px={2}>
        <ArgonTypography variant="h6" fontWeight="medium" textTransform="capitalize">
          {t('userprofile.info')}
        </ArgonTypography>
      </ArgonBox>
      <ArgonBox p={2}>
        <form>
            <ArgonBox key="username" display="flex" py={1} pr={2}>
                <ArgonTypography variant="button" fontWeight="bold" textTransform="capitalize">
                    {t('user.username')}:
                </ArgonTypography>
                <ArgonTypography variant="button" fontWeight="regular" color="text">
                    &nbsp;{user.username}
                </ArgonTypography>
            </ArgonBox>
            <ArgonBox key="emailaddress" display="flex" py={1} pr={2}>
                <ArgonTypography variant="button" fontWeight="bold" textTransform="capitalize">
                    {t('user.emailAddress')}:
                </ArgonTypography>
                <ArgonTypography variant="button" fontWeight="regular" color="text">
                    &nbsp;{user.emailAddress}
                </ArgonTypography>
            </ArgonBox>
            <CustomTextField
                name="firstName"
                id="firstName"
                label={t('user.firstName')}
                type="text"
                fullWidth
                value={values.firstName || ''}
                onChange={handleChange}
                errorMsg={errors.firstName}
                required
            />

            <CustomTextField
                name="secondName"
                id="secondName"
                label={t('user.secondName')}
                type="text"
                fullWidth
                value={values.secondName || ''}
                onChange={handleChange}
            />

            <CustomTextField
                name="lastName"
                id="lastName"
                label={t('user.lastName')}
                type="text"
                fullWidth
                value={values.lastName || ''}
                onChange={handleChange}
                errorMsg={errors.lastName}
                required
            />

            <CustomTextField
                name="secondSurname"
                id="secondSurname"
                label={t('user.secondSurname')}
                type="text"
                fullWidth
                value={values.secondSurname || ''}
                onChange={handleChange}
            />

            <CustomTextField
                name="dob"
                id="dob"
                label={t('user.dob')}
                type="date"
                fullWidth
                value={values.dob || ''}
                onChange={handleChange}
            />
        </form>
        
      </ArgonBox>
      <ArgonButton 
          variant="gradient" 
          onClick={onSaveUser}
          color="dark">
          <Icon sx={{ fontWeight: "bold" }}>save</Icon>
          &nbsp;{t('generic.save')}
        </ArgonButton>
    </Card>
  );
}

ProfileInfoCard.propTypes = {
  user: PropTypes.object.isRequired,
  updateCurrentUser: PropTypes.func.isRequired
};

export default ProfileInfoCard;