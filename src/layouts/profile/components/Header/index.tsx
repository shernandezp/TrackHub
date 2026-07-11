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

import { useState, useEffect } from "react";
import type { ReactNode } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import type { SxProps, Theme } from "@mui/material/styles";

// Argon Dashboard 2 MUI components
import ArgonBoxBase from "components/ArgonBox";
import ArgonTypographyBase from "components/ArgonTypography";
import ArgonAvatarBase from "components/ArgonAvatar";

// Argon Dashboard 2 MUI example components
import DashboardNavbarBase from "controls/Navbars/DashboardNavbar";

// Argon Dashboard 2 MUI base styles
import breakpoints from "assets/theme/base/breakpoints";

// Images
import profileImage from "assets/images/profile.jpeg";

import type { CurrentUser } from "api/security/users";

// Vendored (untyped) Argon primitives — type the props crossing the boundary.
interface ArgonBoxProps {
  children?: ReactNode;
  height?: string | number;
  position?: string;
  mt?: string | number;
  lineHeight?: string | number;
}
const ArgonBox = ArgonBoxBase as unknown as (props: ArgonBoxProps) => ReactNode;

interface ArgonTypographyProps {
  children?: ReactNode;
  variant?: string;
  fontWeight?: string;
  color?: string;
}
const ArgonTypography = ArgonTypographyBase as unknown as (props: ArgonTypographyProps) => ReactNode;

interface ArgonAvatarProps {
  src?: string;
  alt?: string;
  variant?: string;
  size?: string;
  shadow?: string;
}
const ArgonAvatar = ArgonAvatarBase as unknown as (props: ArgonAvatarProps) => ReactNode;

interface DashboardNavbarProps {
  absolute?: boolean;
  light?: boolean;
}
const DashboardNavbar = DashboardNavbarBase as unknown as (props: DashboardNavbarProps) => ReactNode;

interface HeaderProps {
  user: CurrentUser;
}

function Header({ user }: HeaderProps) {
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
          // Argon theme extends MUI Theme with `boxShadows`; annotate the param
          // and cast the object so the strict MUI `sx` type accepts it.
          boxShadow: ({ boxShadows: { md } }: { boxShadows: { md: string } }) => md,
        } as unknown as SxProps<Theme>}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid>
            <ArgonAvatar
              src={profileImage}
              alt="profile-image"
              variant="rounded"
              size="xl"
              shadow="sm"
            />
          </Grid>
          <Grid>
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

export default Header;
