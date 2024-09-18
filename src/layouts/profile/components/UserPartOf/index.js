/**
=========================================================
* Argon Dashboard 2 MUI - v3.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/argon-dashboard-material-ui
* Copyright 2023 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect, useState } from "react";
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import { useTranslation } from 'react-i18next';

function UserPartOf({ user }) {
  const { t } = useTranslation();
  const [roles, setRoles] = useState([]);
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    const fetchRoles= async () => {
      if (user && Object.keys(user).length > 0) {
        setRoles(user.roles);
        setPolicies(user.profiles);
      }
    }; 
    fetchRoles();
  }, [user]);

  return (
    <Card sx={{ height: "100%" }}>
      <ArgonBox pt={2} px={2}>
        <ArgonTypography variant="h6" fontWeight="medium" textTransform="capitalize">
          {t('role.title')}
        </ArgonTypography>
      </ArgonBox>
      <ArgonBox p={2}>
        <ArgonBox component="ul" display="flex" flexDirection="column" p={0} m={0}>
        {roles.map((role) => (
            role.name && 
            <ArgonBox key={role.name} component="li" display="flex" alignItems="center" py={1} mb={1}>
                <ArgonBox
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                justifyContent="center">
                <ArgonTypography variant="button" fontWeight="medium">
                    {role.name}
                </ArgonTypography>
                </ArgonBox>
            </ArgonBox>
            ))}
        </ArgonBox>
      </ArgonBox>
      <ArgonBox pt={2} px={2}>
        <ArgonTypography variant="h6" fontWeight="medium" textTransform="capitalize">
          {t('policy.title')}
        </ArgonTypography>
      </ArgonBox>
      <ArgonBox p={2}>
        <ArgonBox component="ul" display="flex" flexDirection="column" p={0} m={0}>
        {policies.map((policy) => (
            policy.name && 
            <ArgonBox key={policy.name} component="li" display="flex" alignItems="center" py={1} mb={1}>
                <ArgonBox
                display="flex"
                flexDirection="column"
                alignItems="flex-start"
                justifyContent="center">
                <ArgonTypography variant="button" fontWeight="medium">
                    {policy.name}
                </ArgonTypography>
                </ArgonBox>
            </ArgonBox>
            ))}
        </ArgonBox>
      </ArgonBox>
    </Card>
  );
}

// Typechecking props for the ProfilesList
UserPartOf.propTypes = {
  user: PropTypes.any
};

export default UserPartOf;
