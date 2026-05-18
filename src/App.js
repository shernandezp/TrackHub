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
import React, { useState, useEffect } from 'react';

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Icon from "@mui/material/Icon";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";

// Argon Dashboard 2 MUI example components
import Sidenav from "controls/Sidenav";
import Configurator from "controls/Configurator";

// Argon Dashboard 2 MUI themes
import theme from "assets/theme";
import themeDark from "assets/theme-dark";

// Argon Dashboard 2 MUI routes
import routes from "routes";

// Argon Dashboard 2 MUI contexts
import { 
  useArgonController, 
  setOpenConfigurator,
  setDarkSidenav,
  setMiniSidenav,
  setDarkMode,
 } from "context";

// Images
import brand from "assets/images/logo-th.svg";
import brandDark from "assets/images/logo-th-dark.svg";

// Icon Fonts
import "assets/css/nucleo-icons.css";
import "assets/css/nucleo-svg.css";

import { useAuth } from "AuthContext";
import { LoadingContext } from 'LoadingContext';
import { ClipLoader } from 'react-spinners';
import useUserService from "services/users";
import useSettignsService from 'services/settings';
import useAccountService from "services/account";
import useAccountFeatureService from "services/accountFeatures";
import usePrincipalService from "services/principals";
import { useTranslation } from 'react-i18next';
import ErrorBoundary from "components/ErrorBoundary";
import PrincipalTypes from "constants/principalTypes";

export default function App() {
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, direction, layout, openConfigurator, darkMode } =
    controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const { isAuthenticated, login, isLoggingIn, authError } = useAuth();
  const { pathname } = useLocation();
  const { isAdmin, isManager } = useUserService();
  const { getUserSettings, getAccountSettings, updateAccountSettings } = useSettignsService();
  const { getAccountByUser } = useAccountService();
  const { getAccountFeatures } = useAccountFeatureService();
  const { getCurrentPrincipal } = usePrincipalService();
  const { i18n } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(true);
  const [userIsManager, setUserIsManager] = useState(true);
  const [accountSettings, setAccountSettings] = useState({});
  const [accountFeatures, setAccountFeatures] = useState([]);
  const [currentPrincipal, setCurrentPrincipal] = useState(null);

  useEffect(() => {
    // Redirect to login page if not authenticated
    // Skip redirect if: on callback page, already logging in, on error page, or auth error occurred
    const isAuthRoute = pathname.startsWith("/authentication/");
    const isErrorPage = pathname === "/error";
    
    if (!isAuthenticated && !isLoggingIn && !isAuthRoute && !isErrorPage && !authError) {
      login();
    }
  
  }, [isAuthenticated, isLoggingIn, login, pathname, authError]);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (isAuthenticated) {
        const principal = await getCurrentPrincipal();
        setCurrentPrincipal(principal);
        const admin = await isAdmin();
        const manager = await isManager();
        const userSettings = await getUserSettings();
        setUserIsAdmin(admin);
        setUserIsManager(manager);
        /* Initialize settings */
        setDarkMode(dispatch, userSettings.style !== 'light');
        setDarkSidenav(dispatch, userSettings.style !== 'light');
        setMiniSidenav(dispatch, userSettings.navbar !== 'none');
        if (userSettings.language) {
          i18n.changeLanguage(userSettings.language);
        }
        const settings = await getAccountSettings();
        setAccountSettings(settings);
        const account = await getAccountByUser();
        if (account?.accountId) {
          const features = await getAccountFeatures(account.accountId);
          setAccountFeatures(features || []);
        }
      }
    };
    fetchPermissions();
  }, [isAuthenticated]);

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Change the openConfigurator state
  const handleConfiguratorOpen = () => setOpenConfigurator(dispatch, !openConfigurator);

  // Setting the dir attribute for the body element
  useEffect(() => {
    document.body.setAttribute("dir", direction);
  }, [direction]);

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const featureEnabled = (featureKey) => {
    if (!featureKey) return true;
    const feature = accountFeatures.find(item => item.featureKey === featureKey);
    return feature ? feature.enabled : false;
  };

  const filterRoutesByFeatures = (allRoutes) =>
    allRoutes
      .filter(route => featureEnabled(route.featureKey))
      .map(route => route.collapse ? { ...route, collapse: filterRoutesByFeatures(route.collapse) } : route);

  const enabledRoutes = filterRoutesByFeatures(routes);

  const routeAllowed = (route) => {
    if (route.key === 'systemAdmin' && !userIsAdmin) return false;
    if (route.key === 'manageAdmin' && !userIsManager) return false;
    if (currentPrincipal?.principalType) {
      const allowedPrincipalTypes = route.principalTypes || [PrincipalTypes.User];
      if (!allowedPrincipalTypes.includes(currentPrincipal.principalType)) return false;
    }
    return true;
  };

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route exact path={route.route} element={routeAllowed(route) ? route.component : <Navigate to="/dashboard" replace />} key={route.key} />;
      }

      return null;
    });

  const configsButton = (
    <ArgonBox
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="3.5rem"
      height="3.5rem"
      bgColor="white"
      shadow="sm"
      borderRadius="50%"
      position="fixed"
      right="2rem"
      bottom="2rem"
      zIndex={99}
      color="dark"
      sx={{ cursor: "pointer" }}
      onClick={handleConfiguratorOpen}
    >
      <Icon fontSize="default" color="inherit">
        settings
      </Icon>
    </ArgonBox>
  );

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      <ThemeProvider theme={darkMode ? themeDark : theme}>
        <CssBaseline />
        <ErrorBoundary>
          {layout === "dashboard" && (
          <>
            <Sidenav
              brand={darkMode ? brand : brandDark}
              brandName="Track Hub"
              routes={enabledRoutes}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
              isAdmin={userIsAdmin}
              isManager={userIsManager}
              currentPrincipal={currentPrincipal}
            />
            <Configurator 
              settings={accountSettings}
              updateSettings={updateAccountSettings}
               />
            {userIsManager && configsButton}
          </>
        )}
        <Routes>
          {getRoutes(enabledRoutes)}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </ErrorBoundary>
        {loading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }}>
            <ClipLoader color="#00BFFF" loading={loading} size={150} />
          </div>
        )}
      </ThemeProvider>
    </LoadingContext.Provider>
  );
}

