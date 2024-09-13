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
import { useArgonController, setMiniSidenav, setOpenConfigurator } from "context";

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

export default function App() {
  const [controller, dispatch] = useArgonController();
  const { miniSidenav, direction, layout, openConfigurator, darkMode } =
    controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const { isAuthenticated, login, isLoggingIn } = useAuth();
  const { pathname } = useLocation();
  const [loading, setLoading] = useState(false);
  const { isAdmin, isManager } = useUserService();
  const [userIsAdmin, setUserIsAdmin] = useState(true);
  const [userIsManager, setUserIsManager] = useState(true);

  useEffect(() => {
    // Redirect to login page if not authenticated
    if (!isAuthenticated && !isLoggingIn && pathname != "/authentication/callback") {
      login();
    }
  
  }, [isAuthenticated, isLoggingIn, login, pathname]);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (isAuthenticated) {
        const admin = await isAdmin();
        const manager = await isManager();
        setUserIsAdmin(admin);
        setUserIsManager(manager);
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

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route exact path={route.route} element={route.component} key={route.key} />;
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
        {layout === "dashboard" && (
          <>
            <Sidenav
              brand={darkMode ? brand : brandDark}
              brandName="Track Hub"
              routes={routes}
              onMouseEnter={handleOnMouseEnter}
              onMouseLeave={handleOnMouseLeave}
              isAdmin={userIsAdmin}
              isManager={userIsManager}
            />
            <Configurator />
            {configsButton}
          </>
        )}
        <Routes>
          {getRoutes(routes)}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
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
