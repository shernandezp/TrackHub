/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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

// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

// @mui material components
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI contexts
import { useArgonController } from "context";

function DetailedStaticsCard({ 
  bgColor = "white", 
  title, 
  count, 
  percentage = {
      color: "success",
      count: '',
      hide: false
    },
  icon = {
    color: "primary",
    component: <i className="default-icon" />
  }, 
  direction = "right" 
  }) {
  const [controller] = useArgonController();
  const { darkMode } = controller;

  return (
    <Card>
      <ArgonBox
        bgColor={bgColor === "white" && darkMode ? "transparent" : bgColor}
        variant={bgColor === "white" && darkMode ? "contained" : "gradient"}
      >
        <ArgonBox p={2}>
          <Grid container>
            {direction === "left" ? (
              <Grid item>
                <ArgonBox
                  variant="gradient"
                  bgColor={bgColor === "white" ? icon.color : "white"}
                  color={bgColor === "white" ? "white" : "dark"}
                  width="3rem"
                  height="3rem"
                  borderRadius="section"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                >
                  {typeof icon.component === "string" ? (
                    <Icon fontSize="small" color="inherit">
                      {icon.component}
                    </Icon>
                  ) : (
                    <ArgonBox
                      fontSize="1.125rem"
                      display="grid"
                      placeitems="center"
                      color="inherit"
                    >
                      {icon.component}
                    </ArgonBox>
                  )}
                </ArgonBox>
              </Grid>
            ) : null}
            <Grid item xs={8}>
              <ArgonBox ml={direction === "left" ? 2 : 0} lineHeight={1}>
                <ArgonTypography
                  variant="button"
                  color={bgColor === "white" ? "text" : "white"}
                  textTransform="uppercase"
                  fontWeight="medium"
                >
                  {title}
                </ArgonTypography>
                <ArgonTypography
                  variant="h5"
                  fontWeight="bold"
                  color={bgColor === "white" ? "dark" : "white"}
                  mb={1}
                >
                  {count}
                </ArgonTypography>
              </ArgonBox>
            </Grid>
            {direction === "right" ? (
              <Grid item xs={4}>
                <ArgonBox
                  variant="gradient"
                  bgColor={bgColor === "white" ? icon.color : "white"}
                  color={bgColor === "white" ? "white" : "dark"}
                  width="3rem"
                  height="3rem"
                  borderRadius="section"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  ml="auto"
                >
                  {typeof icon.component === "string" ? (
                    <Icon fontSize="small" color="inherit">
                      {icon.component}
                    </Icon>
                  ) : (
                    <ArgonBox
                      fontSize="1.125rem"
                      display="grid"
                      placeitems="center"
                      color="inherit"
                    >
                      {icon.component}
                    </ArgonBox>
                  )}
                </ArgonBox>
              </Grid>
            ) : null}
          </Grid>
          {!percentage.hide && (
          <ArgonTypography
            display="flex"
            alignItems="center"
            variant="button"
            fontWeight="bold"
            color={percentage.color}
          >
            {percentage.count}
          </ArgonTypography>)}
        </ArgonBox>
      </ArgonBox>
    </Card>
  );
}

// Typechecking props for the DetailedStaticsCard
DetailedStaticsCard.propTypes = {
  bgColor: PropTypes.oneOf([
    "transparent",
    "white",
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "dark",
  ]),
  title: PropTypes.string.isRequired,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  percentage: PropTypes.shape({
    color: PropTypes.string,
    count: PropTypes.string,
    hide: PropTypes.bool
  }),
  icon: PropTypes.shape({
    color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
    component: PropTypes.node.isRequired,
  }).isRequired,
  direction: PropTypes.oneOf(["right", "left"]),
};

export default DetailedStaticsCard;
