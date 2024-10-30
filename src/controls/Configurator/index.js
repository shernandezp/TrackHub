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

import { useContext, useState, useEffect } from "react";

// @mui material components
import Divider from "@mui/material/Divider";
import Switch from "@mui/material/Switch";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import CustomTextField from 'controls/Dialogs/CustomTextField';

// Custom styles for the Configurator
import ConfiguratorRoot from "controls/Configurator/ConfiguratorRoot";
import { useTranslation } from 'react-i18next';
import CustomSelect from 'controls/Dialogs/CustomSelect';
import { LoadingContext } from 'LoadingContext';
import maps from 'data/maps';
import PropTypes from "prop-types";

// Argon Dashboard 2 MUI context
import {
  useArgonController,
  setOpenConfigurator
} from "context";

function Configurator({ settings, updateSettings }) {
  const { setLoading } = useContext(LoadingContext);
  const [controller, dispatch] = useArgonController();
  const { openConfigurator, darkMode } =
    controller;
  const { t } = useTranslation();
  const mapOptions = maps
    .map(type => ({ value: type, label: type }));

  const [accountSettings, setAccountSettings] = useState({maps: 'OSM', storeLastPosition: false, refreshMap: false});
  const handleCloseConfigurator = () => setOpenConfigurator(dispatch, false);

  useEffect(() => {
    const fetchAccountSettings = async () => {
      if (settings && settings.maps)
      setAccountSettings(settings);
    };
  
    fetchAccountSettings();
  }, [settings]);

  function handleMapsChange(e) {
    setAccountSettings(prevSettings => ({
      ...prevSettings,
      maps: e.target.value
    }));
  }

  const handleMapsKeyChange = (event) => {
    setAccountSettings(prevSettings => ({
      ...prevSettings,
      mapsKey: event.target.value
    }));
  };

  const handleOnlineIntervalChange = (event) => {
    setAccountSettings(prevSettings => ({
      ...prevSettings,
      onlineInterval: event.target.value
    }));
  };

  function handleStorePositionChange() {
    setAccountSettings(prevSettings => ({
      ...prevSettings,
      storeLastPosition: !settings.storeLastPosition
    }));
  }

  const handleStoringIntervalChange = (event) => {
    setAccountSettings(prevSettings => ({
      ...prevSettings,
      storingInterval: event.target.value
    }));
  };

  function handleRefreshMapChange() {
    setAccountSettings(prevSettings => ({
      ...prevSettings,
      refreshMap: !settings.refreshMap
    }));
  }

  const handleRefreshMapIntervalChange = (event) => {
    setAccountSettings(prevSettings => ({
      ...prevSettings,
      refreshMapInterval: event.target.value
    }));
  };

  async function onSaveSettings() {
    setLoading(true);
    updateSettings(accountSettings.accountId, accountSettings);
    setLoading(false);
    alert(t('settings.saveMessage'));
  }

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
        <ArgonBox display="flex" justifyContent="space-between" lineHeight={1}>
          <CustomSelect
              list={mapOptions}
              handleChange={handleMapsChange}
              name="map"
              id="map"
              label={t('settings.maps')}
              value={accountSettings.maps}
              numericValue={false}
              required
            />
        </ArgonBox>

        {(accountSettings.maps !== 'OSM' && 
          <ArgonBox display="flex" justifyContent="space-between" lineHeight={1}>
            <CustomTextField
              margin="dense"
              name="mapsKey"
              id="mapsKey"
              label={t('settings.mapsKey')}
              type="text"
              fullWidth
              value={accountSettings.mapsKey || ''}
              onChange={handleMapsKeyChange}
              />
          </ArgonBox>)}

        <ArgonBox display="flex" justifyContent="space-between" lineHeight={1}>
          <CustomTextField
            margin="dense"
            name="onlineInterval"
            id="onlineInterval"
            label={t('settings.onlineInterval')}
            type="number"
            fullWidth
            value={accountSettings.onlineInterval || 60}
            onChange={handleOnlineIntervalChange}
            />
        </ArgonBox>

        <ArgonBox display="flex" justifyContent="space-between" mt={3} lineHeight={1}>
          <ArgonTypography variant="h6">{t('settings.refreshMap')}</ArgonTypography>
          <Switch checked={accountSettings.refreshMap} onChange={handleRefreshMapChange} />
        </ArgonBox>
        
        <ArgonBox display="flex" justifyContent="space-between" lineHeight={1}>
          <CustomTextField
            margin="dense"
            name="refreshMapInterval"
            id="refreshMapInterval"
            label={t('settings.refreshMapInterval')}
            type="number"
            fullWidth
            value={accountSettings.refreshMapInterval || 60}
            onChange={handleRefreshMapIntervalChange}
          />
        </ArgonBox>

        <ArgonBox display="flex" justifyContent="space-between" mt={3} lineHeight={1}>
          <ArgonTypography variant="h6">{t('settings.storePosition')}</ArgonTypography>
          <Switch checked={accountSettings.storeLastPosition} onChange={handleStorePositionChange} />
        </ArgonBox>

        <ArgonBox display="flex" justifyContent="space-between" lineHeight={1}>
          <CustomTextField
            margin="dense"
            name="storingInterval"
            id="storingInterval"
            label={t('settings.storingInterval')}
            type="number"
            fullWidth
            value={accountSettings.storingInterval || 360}
            onChange={handleStoringIntervalChange}
          />
        </ArgonBox>

        <Divider />

        <ArgonButton 
          variant="gradient" 
          onClick={onSaveSettings}
          color="dark">
          <Icon sx={{ fontWeight: "bold" }}>save</Icon>
          &nbsp;{t('generic.save')}
        </ArgonButton>
        
      </ArgonBox>
    </ConfiguratorRoot>
  );
}

Configurator.propTypes = {
  settings: PropTypes.object.isRequired,
  updateSettings: PropTypes.func.isRequired
};

export default Configurator;
