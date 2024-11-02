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

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";

// Custom styles for the sidenavItem
import { item, itemIcon, itemText, itemIconBox } from "controls/Sidenav/styles/sidenavItem";

// Argon Dashboard 2 MUI context
import { useArgonController } from "context";

function SidenavItem({ color = "info", icon, name, active = false, open = false, ...rest }) {
  const [controller] = useArgonController();
  const { miniSidenav, darkSidenav, sidenavColor } = controller;

  return (
    <>
      <ListItem component="li">
        <ArgonBox
          {...rest}
          sx={(theme) => item(theme, { active, darkSidenav, sidenavColor, miniSidenav })}
        >
          <ListItemIcon sx={(theme) => itemIconBox(theme, { active, darkSidenav, sidenavColor })}>
            {typeof icon === "string" ? (
              <Icon sx={(theme) => itemIcon(theme, { active })}>{icon}</Icon>
            ) : (
              icon
            )}
          </ListItemIcon>

          <ListItemText
            primary={name}
            sx={(theme) => itemText(theme, { miniSidenav, darkSidenav, active })}
          />
        </ArgonBox>
      </ListItem>
    </>
  );
}

// Typechecking props for the SidenavItem
SidenavItem.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  icon: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  active: PropTypes.bool,
  open: PropTypes.bool,
};

export default SidenavItem;
