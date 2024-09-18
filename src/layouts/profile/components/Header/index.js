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

import { useState, useEffect } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonAvatar from "components/ArgonAvatar";

// Argon Dashboard 2 MUI example components
import DashboardNavbar from "controls/Navbars/DashboardNavbar";

// Argon Dashboard 2 MUI base styles
import breakpoints from "assets/theme/base/breakpoints";

// Images
import profileImage from "assets/images/profile.jpeg";

import PropTypes from "prop-types";

function Header({ user }) {
  const [tabsOrientation, setTabsOrientation] = useState("horizontal");
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchData= async () => {
      if (user && Object.keys(user).length > 0) {
        setName(`${user.firstName} ${user.lastName}`);
        setEmail(user.emailAddress);
      }
    }; 
    fetchData();
  }, [user]);

  useEffect(() => {
    // A function that sets the orientation state of the tabs.
    function handleTabsOrientation() {
      return window.innerWidth < breakpoints.values.sm
        ? setTabsOrientation("vertical")
        : setTabsOrientation("horizontal");
    }

    /** 
     The event listener that's calling the handleTabsOrientation function when resizing the window.
    */
    window.addEventListener("resize", handleTabsOrientation);

    // Call the handleTabsOrientation function to set the state with the initial value.
    handleTabsOrientation();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleTabsOrientation);
  }, [tabsOrientation]);

  return (
    <ArgonBox position="relative">
      <DashboardNavbar absolute light />
      <ArgonBox height="220px" />
      <Card
        sx={{
          py: 2,
          px: 2,
          boxShadow: ({ boxShadows: { md } }) => md,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <ArgonAvatar
              src={profileImage}
              alt="profile-image"
              variant="rounded"
              size="xl"
              shadow="sm"
            />
          </Grid>
          <Grid item>
            <ArgonBox height="100%" mt={0.5} lineHeight={1}>
              <ArgonTypography variant="h5" fontWeight="medium">
                {name}
              </ArgonTypography>
              <ArgonTypography variant="button" color="text" fontWeight="medium">
                {email}
              </ArgonTypography>
            </ArgonBox>
          </Grid>
        </Grid>
      </Card>
    </ArgonBox>
  );
}

Header.propTypes = {
  user: PropTypes.any
};


export default Header;
