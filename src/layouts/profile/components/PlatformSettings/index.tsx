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
import type { ChangeEvent, ReactNode } from "react";

// @mui material components
import Card from "@mui/material/Card";
import Switch from "@mui/material/Switch";
import ArgonButtonBase from "components/ArgonButton";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonBoxBase from "components/ArgonBox";
import ArgonTypographyBase from "components/ArgonTypography";
import { useTranslation } from 'react-i18next';
import CustomSelectBase from 'controls/Dialogs/CustomSelect';
import { getUserSettings, updateUserSettings } from 'api/manager/settings';
import type { UserSettings, UserSettingsDtoInput } from 'api/manager/settings';
import { notifyApiError } from 'api/core/errors';
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";
import {
  useArgonController,
  setDarkSidenav,
  setMiniSidenav,
  setDarkMode,
} from "context";

// Vendored (untyped) Argon primitives — type the props crossing the boundary.
interface ArgonBoxProps {
  children?: ReactNode;
  display?: string;
  width?: string | number;
  mt?: string | number;
  ml?: string | number;
  mb?: string | number;
  pt?: string | number;
  pb?: string | number;
  px?: string | number;
  py?: string | number;
  lineHeight?: string | number;
}
const ArgonBox = ArgonBoxBase as unknown as (props: ArgonBoxProps) => ReactNode;

interface ArgonTypographyProps {
  children?: ReactNode;
  variant?: string;
  fontWeight?: string;
  color?: string;
  textTransform?: string;
}
const ArgonTypography = ArgonTypographyBase as unknown as (props: ArgonTypographyProps) => ReactNode;

interface ArgonButtonProps {
  children?: ReactNode;
  variant?: string;
  color?: string;
  onClick?: () => void;
}
const ArgonButton = ArgonButtonBase as unknown as (props: ArgonButtonProps) => ReactNode;

interface CustomSelectProps {
  list: Array<{ value: string; label: string }>;
  handleChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  name: string;
  id: string;
  label: string;
  value?: string;
  numericValue?: boolean;
  required?: boolean;
}
const CustomSelect = CustomSelectBase as unknown as (props: CustomSelectProps) => ReactNode;

function PlatformSettings() {
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, darkMode } =
    controller;
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const languages = (i18n.options.supportedLngs || [])
    .filter(lang => lang !== 'cimode')
    .map(lang => ({ value: lang, label: lang }));
  const [style, setStyle] = useState(false);
  const [sideNav, setSideNav] = useState(false);
  const [userSettings, setUserSettings] = useState<Partial<UserSettings>>({ language: 'en' });

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const handleDarkMode = () => {
    setDarkSidenav(dispatch, !darkMode);
    setDarkMode(dispatch, !darkMode);
  };

  useEffect(() => {
    const fetchUserSettings = async () => {
      setLoading(true);
      try {
        const userSettings = await getUserSettings();
        setStyle(userSettings.style !== 'light');
        setSideNav(userSettings.navbar !== 'none');
        setUserSettings(userSettings);
      } catch (error) {
        notifyApiError(error);
      } finally {
        setLoading(false);
      }
    };
    if(isAuthenticated)
      fetchUserSettings();
  }, [isAuthenticated]);

  async function onSaveSettings() {
    setLoading(true);
    try {
      // userId is populated once settings load; the assertion/cast keep the exact
      // runtime call the JS made while satisfying the typed api signature.
      await updateUserSettings(
        userSettings.userId!,
        userSettings as Omit<UserSettingsDtoInput, 'userId'>
      );
    } catch (error) {
      notifyApiError(error);
    } finally {
      setLoading(false);
    }
  }

  function handleLanguageChange(e: ChangeEvent<HTMLInputElement>) {
    setUserSettings(prevSettings => ({
      ...prevSettings,
      language: e.target.value
    }));
    i18n.changeLanguage(e.target.value);
  }

  function handleStyleChange() {
    setStyle(!style);
    setUserSettings(prevSettings => ({
      ...prevSettings,
      style: !style ? 'dark' : 'light'
    }));
    handleDarkMode();
  }

  function handleNavbarChange() {
    setSideNav(!sideNav);
    setUserSettings(prevSettings => ({
      ...prevSettings,
      navbar: !sideNav ? 'collapsed' : 'none'
    }));
    handleMiniSidenav();
  }

  return (
    <Card>
      <ArgonBox pt={2} px={2}>
        <ArgonTypography variant="h6" fontWeight="medium" textTransform="capitalize">
          {t('userprofile.title')}
        </ArgonTypography>
      </ArgonBox>
      <ArgonBox pt={1.5} pb={2} px={2} lineHeight={1.25}>
        <ArgonTypography variant="caption" fontWeight="bold" color="text" textTransform="uppercase">
          {t('userprofile.account')}
        </ArgonTypography>
        <ArgonBox display="flex" py={1} mb={0.25}>
          <ArgonBox mt={0.25}>
            <Switch checked={style} onChange={handleStyleChange} />
          </ArgonBox>
          <ArgonBox width="80%" ml={2}>
            <ArgonTypography variant="button" fontWeight="regular" color="text">
              {t('userprofile.style')}
            </ArgonTypography>
          </ArgonBox>
        </ArgonBox>
        <ArgonBox display="flex" py={1} mb={0.25}>
          <ArgonBox mt={0.25}>
            <Switch checked={sideNav} onChange={handleNavbarChange} />
          </ArgonBox>
          <ArgonBox width="80%" ml={2}>
            <ArgonTypography variant="button" fontWeight="regular" color="text">
              {t('userprofile.sidenav')}
            </ArgonTypography>
          </ArgonBox>
        </ArgonBox>
        <ArgonBox display="flex" py={1} mb={0.25}>
          <CustomSelect
              list={languages}
              handleChange={handleLanguageChange}
              name="language"
              id="language"
              label={t('userprofile.language')}
              value={userSettings.language}
              numericValue={false}
              required
            />
        </ArgonBox>

        <ArgonButton
          variant="gradient"
          onClick={onSaveSettings}
          color="dark">
          <Icon sx={{ fontWeight: "bold" }}>save</Icon>
          &nbsp;{t('generic.save')}
        </ArgonButton>
      </ArgonBox>
    </Card>
  );
}

export default PlatformSettings;
