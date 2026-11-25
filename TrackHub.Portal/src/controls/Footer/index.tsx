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

import Link from "@mui/material/Link";

import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

import typography from "assets/theme/base/typography";

import { versionLabel } from "constants/appVersion";

interface FooterCompany {
  href: string;
  name: string;
}

interface FooterProps {
  company?: FooterCompany;
}

function Footer({
  company = { href: "https://github.com/shernandezp/", name: "TrackHub" },
}: FooterProps) {
  const { href, name } = company;
  const { size } = typography;

  return (
    <ArgonBox
      width="100%"
      display="flex"
      flexDirection={{ xs: "column", lg: "row" }}
      justifyContent="space-between"
      alignItems="center"
      px={1.5}
    >
      <ArgonBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexWrap="wrap"
        color="text"
        fontSize={size.sm}
        px={1.5}
      >
        &copy; {new Date().getFullYear()},
        <Link href={href} target="_blank" rel="noopener noreferrer">
          <ArgonTypography variant="button" fontWeight="medium">
            &nbsp;{name}&nbsp;
          </ArgonTypography>
        </Link>
        {/* Kept in the LEFT group on purpose: the settings button in App.tsx is fixed at right/bottom
            2rem and covers the footer's right edge. Unlabelled and untranslated: "v1.1.0" reads
            the same in every language. */}
        <ArgonTypography variant="button" fontWeight="regular" color="text">
          &middot;&nbsp;{versionLabel()}
        </ArgonTypography>
      </ArgonBox>
    </ArgonBox>
  );
}

export default Footer;
