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

import { useState, useEffect, useContext } from "react";

// @mui material components
import Grid from "@mui/material/Grid";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "controls/LayoutContainers/DashboardLayout";
import Footer from "controls/Footer";
import ProfileInfoCard from "layouts/profile/components/ProfileInfoCard";
import UserPartOf from "layouts/profile/components/UserPartOf";

// Overview page components
import Header from "layouts/profile/components/Header";
import PlatformSettings from "layouts/profile/components/PlatformSettings";

// Data
import useUserService from "services/users";
import { LoadingContext } from 'LoadingContext';

const bgImage =
  "https://raw.githubusercontent.com/creativetimofficial/public-assets/master/argon-dashboard-pro/assets/img/profile-layout-header.jpg";

function Overview() {
  const { getCurrentUser } = useUserService();
  const { setLoading } = useContext(LoadingContext);
  const [user, setUser] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const user = await getCurrentUser();
      setUser(user);
      setLoading(false);
    };
  
    fetchUser();
  }, []);

  return (
    <DashboardLayout
      sx={{
        backgroundImage: ({ functions: { rgba, linearGradient }, palette: { gradients } }) =>
          `${linearGradient(
            rgba(gradients.info.main, 0.6),
            rgba(gradients.info.state, 0.6)
          )}, url(${bgImage})`,
        backgroundPositionY: "50%",
      }}
    >
      <Header user= {user}/>
      <ArgonBox mt={5} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} xl={4}>
            <PlatformSettings />
          </Grid>
          <Grid item xs={12} md={6} xl={4}>
            <ProfileInfoCard
              user={user}
            />
          </Grid>
          <Grid item xs={12} xl={4}>
            <UserPartOf user={user} />
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
