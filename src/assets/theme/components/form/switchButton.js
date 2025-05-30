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
import colors from "assets/theme/base/colors";
import borders from "assets/theme/base/borders";
import boxShadows from "assets/theme/base/boxShadows";

// Argon Dashboard 2 MUI helper functions
import rgba from "assets/theme/functions/rgba";
import pxToRem from "assets/theme/functions/pxToRem";
import linearGradient from "assets/theme/functions/linearGradient";

const { white, light, gradients } = colors;
const { borderWidth } = borders;
const { md } = boxShadows;

const switchButton = {
  defaultProps: {
    disableRipple: true,
  },

  styleOverrides: {
    root: {
      width: pxToRem(40),
      height: pxToRem(20),
      margin: `${pxToRem(4)} 0`,
      padding: 0,
      borderRadius: pxToRem(160),
      transition: "transform 250ms ease-in",
    },

    switchBase: {
      padding: 0,
      top: "50%",
      transform: `translate(${pxToRem(2)}, -50%)`,
      transition: `transform 250ms ease-in-out`,

      "&.Mui-checked": {
        transform: `translate(${pxToRem(22)}, -50%)`,

        "& + .MuiSwitch-track": {
          backgroundColor: `${rgba(gradients.info.state, 0.95)} !important`,
          borderColor: `${rgba(gradients.info.state, 0.95)} !important`,
          opacity: 1,
        },
      },

      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: "0.3 !important",
      },

      "&.Mui-focusVisible .MuiSwitch-thumb": {
        backgroundImage: linearGradient(gradients.info.main, gradients.info.state),
      },
    },

    thumb: {
      width: pxToRem(16),
      height: pxToRem(16),
      backgroundColor: white.main,
      boxShadow: md,
      top: "50%",
    },

    track: {
      backgroundColor: rgba(gradients.dark.state, 0.1),
      border: `${borderWidth[1]} solid ${light.main}`,
      borderRadius: pxToRem(160),
      opacity: 1,
      transition: `background-color 250ms ease, border-color 200ms ease`,
    },

    checked: {},
  },
};

export default switchButton;
