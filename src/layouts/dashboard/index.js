/* eslint-disable no-unused-vars */
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

import React, { useState, useEffect, useContext  } from 'react';
// @mui material components
import Grid from "@mui/material/Grid";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "controls/LayoutContainers/DashboardLayout";
import DashboardNavbar from "controls/Navbars/DashboardNavbar";
import Footer from "controls/Footer";
import DetailedStatisticsCard from "controls/Cards/StatisticsCards/DetailedStatisticsCard";
import TransportersTable from "layouts/dashboard/components/TransportersTable";
import TransporterList from "layouts/dashboard/components/TransporterList";
import RefreshCounter from 'layouts/dashboard/components/RefreshCounter';
import useRouterService from "services/router";
import useSettignsService from 'services/settings';
import { LoadingContext } from 'LoadingContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from "AuthContext";

// Dashboard layout components
import GeneralMap from "controls/Maps/GeneralMap";
import RefreshLabelStyle from 'layouts/dashboard/styles/RefreshLabel';
import {countRecentDevices, countDevicesInMovement, getPercentage} from 'layouts/dashboard/utils/dashboard';

function Default() {
  const { t } = useTranslation();
  const { getPositions } = useRouterService();
  const { getAccountSettings } = useSettignsService();
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();
  const [positions, setPositions] = useState([]);
  const [active, setActive] = useState(0);
  const [movement, setMovement] = useState(0);
  const [settings, setSettings] = useState({maps:'OSM', mapsKey:'', refreshMapTimer: 60});
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  
  const fetchPositions = async () => {
    setLoading(true);
    var result = await getPositions();
    var settings = await getAccountSettings();
    setSettings(settings);
    setPositions(result);
    setActive(countRecentDevices(result, settings.onlineTimeLapse));
    setMovement(countDevicesInMovement(result));
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPositions();
    }
  }, [isAuthenticated]);

  const handleSelected = (selected) => {
    setSelectedTransporter(selected);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} lg={4}>
            <DetailedStatisticsCard
              title={t("dashboard.totalTitle")}
              count={positions.length}
              icon={{ color: "info", component: <i className="ni ni-map-big" /> }}
              percentage={{ color: "success", hide: true }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <DetailedStatisticsCard
              title={t("dashboard.activeTitle")}
              count={active}
              icon={{ color: "error", component: <i className="ni ni-watch-time" /> }}
              percentage={{ color: "success", count: `${getPercentage(active, positions.length)}%` }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <DetailedStatisticsCard
              title={t("dashboard.movementTitle")}
              count={movement}
              icon={{ color: "success", component: <i className="ni ni-button-play" /> }}
              percentage={{ color: "error", count: `${getPercentage(movement)}%` }}
            />
          </Grid>
        </Grid>
        <Grid container spacing={3} mb={3}>
        <Grid item xs={12} lg={12}>
          <RefreshLabelStyle>
            <GeneralMap 
              mapType={settings.maps} 
              positions={positions} 
              mapKey={settings.mapsKey}
              selectedMarker={selectedTransporter}
              handleSelected={handleSelected}/>
            <RefreshCounter settings={settings} fetchPositions={fetchPositions} />
          </RefreshLabelStyle>
        </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TransportersTable 
              transporters={positions} 
              selected={selectedTransporter}
              handleSelected={handleSelected} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TransporterList title={t("dashboard.typesTitle")} positions={positions} />
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Default;
