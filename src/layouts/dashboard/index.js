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

import React, { useState, useEffect, useContext } from 'react';
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
import CategoriesList from "controls/Lists/CategoriesList";
import useRouterService from "services/router";
import { LoadingContext } from 'LoadingContext';
import { useTranslation } from 'react-i18next';

// Dashboard layout components
import GeneralMap from "controls/Maps/GeneralMap";

// Data
import categoriesListData from "layouts/dashboard/data/categoriesListData";

function Default() {
  const { getPositions } = useRouterService();
  const { setLoading } = useContext(LoadingContext);
  const [positions, setPositions] = useState([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [movement, setMovement] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPositions = async () => {
      setLoading(true);
      var result = await getPositions();
      setPositions(result);
      setTotal(result.length);
      setActive(countRecentDevices(result));
      setMovement(countDevicesInMovement(result));
      setLoading(false);
    };
    fetchPositions();
  }, []);

  function countRecentDevices(devices) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000); // time one hour ago - get this from the account settings
    const recentDevices = devices.filter(device => {
        const deviceDateTime = new Date(device.deviceDateTime);
        return deviceDateTime > oneHourAgo && deviceDateTime <= now;
    });
    return recentDevices.length;
  }

  function countDevicesInMovement(devices) {
    const movingDevices = devices.filter(device => device.speed > 0);
    return movingDevices.length;
  }

  function getPercentage(count) {
    const percentage = total && total > 0 ? (count / total) * 100 : 0;
    return percentage.toFixed(2);
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} lg={4}>
            <DetailedStatisticsCard
              title={t("dashboard.totalTitle")}
              count={total}
              icon={{ color: "info", component: <i className="ni ni-map-big" /> }}
              percentage={{ color: "success", hide: true }}
            />
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <DetailedStatisticsCard
              title={t("dashboard.activeTitle")}
              count={active}
              icon={{ color: "error", component: <i className="ni ni-watch-time" /> }}
              percentage={{ color: "success", count: `${getPercentage(active)}%` }}
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
            <GeneralMap mapType="OSM" positions={positions} />
          </Grid>
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TransportersTable transporters={positions} />
          </Grid>
          <Grid item xs={12} md={4}>
            <CategoriesList title="categories" categories={categoriesListData} />
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Default;
