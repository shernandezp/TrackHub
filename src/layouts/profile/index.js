/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

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
import { useAuth } from "AuthContext";

const bgImage = "assets/images/vr-bg.jpg";


function Overview() {
  const { getCurrentUser, updateCurrentUser, updatePassword } = useUserService();
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();
  const [user, setUser] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const user = await getCurrentUser();
      setUser(user);
      setLoading(false);
    };
    if(isAuthenticated)
      fetchUser();
  }, [isAuthenticated]);

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
          <Grid item size={{xs: 12, md: 6, xl:4}}>
            <PlatformSettings />
          </Grid>
          <Grid item size={{xs: 12, md: 6, xl:4}}>
            <ProfileInfoCard
              user={user}
              updateCurrentUser={updateCurrentUser}
              updatePassword={updatePassword}
            />
          </Grid>
          <Grid item size={{xs: 12, xl:4}}>
            <UserPartOf user={user} />
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Overview;
