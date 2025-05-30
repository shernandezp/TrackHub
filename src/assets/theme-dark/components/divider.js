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

// Argon Dashboard 2 MUI base styles
import colors from "assets/theme-dark/base/colors";

// Argon Dashboard 2 MUI helper functions
import rgba from "assets/theme-dark/functions/rgba";
import pxToRem from "assets/theme-dark/functions/pxToRem";

const { dark, transparent, white } = colors;

const divider = {
  styleOverrides: {
    root: {
      backgroundColor: transparent.main,
      backgroundImage: `linear-gradient(to right, ${rgba(white.main, 0)}, ${rgba(
        white.main,
        0.4
      )}, ${rgba(white.main, 0)}) !important`,
      height: pxToRem(1),
      margin: `${pxToRem(16)} 0`,
      borderBottom: 0,
      borderLeft: 0,
      borderRight: 0,
      opacity: 0.25,
    },

    vertical: {
      backgroundColor: transparent.main,
      backgroundImage: `linear-gradient(180deg, ${rgba(white.main, 0)}, ${rgba(
        white.main,
        0.4
      )}, ${rgba(white.main, 0)}) !important`,
      width: pxToRem(1),
      height: "100%",
      margin: `0 ${pxToRem(16)}`,
      borderRight: "unset",
    },

    light: {
      backgroundColor: transparent.main,
      backgroundImage: `linear-gradient(to right, ${rgba(dark.main, 0)}, ${dark.main}, ${rgba(
        dark.main,
        0
      )}) !important`,

      "&.MuiDivider-vertical": {
        backgroundImage: `linear-gradient(180deg, ${rgba(dark.main, 0)}, ${dark.main}, ${rgba(
          dark.main,
          0
        )}) !important`,
      },
    },
  },
};

export default divider;
