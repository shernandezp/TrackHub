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

// @mui material components
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Custom styles for the Configurator
import ConfiguratorRoot from "controls/Configurator/ConfiguratorRoot";
import { useTranslation } from 'react-i18next';

// Argon Dashboard 2 MUI context
import {
  useArgonController,
  setOpenConfigurator,
  setDarkSidenav,
  setMiniSidenav,
  setFixedNavbar,
  setDarkMode,
} from "context";

function Configurator() {
  const [controller, dispatch] = useArgonController();
  const { openConfigurator, miniSidenav, fixedNavbar, darkMode } =
    controller;
  const { t } = useTranslation();

  const handleCloseConfigurator = () => setOpenConfigurator(dispatch, false);
  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleFixedNavbar = () => setFixedNavbar(dispatch, !fixedNavbar);
  const handleDarkMode = () => {
    setDarkSidenav(dispatch, !darkMode);
    setDarkMode(dispatch, !darkMode);
  };

  return (
    <ConfiguratorRoot variant="permanent" ownerState={{ openConfigurator }}>
      <ArgonBox
        display="flex"
        justifyContent="space-between"
        alignItems="baseline"
        pt={3}
        pb={0.8}
        px={3}
      >
        <ArgonBox>
          <ArgonTypography variant="h5">{t('settings.title')}</ArgonTypography>
          <ArgonTypography variant="body2" color="text">
            {t('settings.detail')}
          </ArgonTypography>
        </ArgonBox>

        <Icon
          sx={({ typography: { size, fontWeightBold }, palette: { dark, white } }) => ({
            fontSize: `${size.md} !important`,
            fontWeight: `${fontWeightBold} !important`,
            color: darkMode ? white.main : dark.main,
            stroke: darkMode ? white.main : dark.main,
            strokeWidth: "2px",
            cursor: "pointer",
            mt: 2,
          })}
          onClick={handleCloseConfigurator}
        >
          close
        </Icon>
      </ArgonBox>

      <Divider />

      <ArgonBox pt={1.25} pb={3} px={3}>

        <ArgonBox display="flex" justifyContent="space-between" mt={3} lineHeight={1}>
          <ArgonTypography variant="h6">Navbar Fixed</ArgonTypography>

          <Switch checked={fixedNavbar} onChange={handleFixedNavbar} />
        </ArgonBox>

        <Divider />

        <ArgonBox display="flex" justifyContent="space-between" lineHeight={1}>
          <ArgonTypography variant="h6">{t('settings.sidenav')}</ArgonTypography>

          <Switch checked={miniSidenav} onChange={handleMiniSidenav} />
        </ArgonBox>

        <Divider />

        <ArgonBox display="flex" justifyContent="space-between" lineHeight={1}>
          <ArgonTypography variant="h6">{t('settings.style')}</ArgonTypography>

          <Switch checked={darkMode} onChange={handleDarkMode} />
        </ArgonBox>

      </ArgonBox>
    </ConfiguratorRoot>
  );
}

export default Configurator;
