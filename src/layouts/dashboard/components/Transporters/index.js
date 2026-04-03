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

import React, { useState, useEffect, useContext, useRef  } from 'react';
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import ArgonBox from "components/ArgonBox";
import DetailedStatisticsCard from "controls/Cards/StatisticsCards/DetailedStatisticsCard";
import TransportersTable from "layouts/dashboard/components/TransportersTable";
import RefreshCounter from 'layouts/dashboard/components/RefreshCounter';
import useRouterService from "services/router";
import useGeofencingService from "services/geofencing";
import { cleanString } from 'utils/stringUtils';
import { LoadingContext } from 'LoadingContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from "AuthContext";

// Dashboard layout components
import GeneralMap from "layouts/dashboard/components/GeneralMap";
import MapControlStyle from 'controls/Maps/styles/MapControl';
import {countRecentDevices, countDevicesInMovement, getPercentage} from 'layouts/dashboard/utils/dashboard';

function Transporters({searchQuery, settings, setShowGeofence, showGeofence, geofences}) {
  const { t } = useTranslation();
  const { getDevicePositions } = useRouterService();
  const { getTransportersInGeofence } = useGeofencingService();
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();
  const [positions, setPositions] = useState([]);
  const [active, setActive] = useState(0);
  const [movement, setMovement] = useState(0);
  const [inGeofence, setInGeofence] = useState(0);
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  const [typeSummary, setTypeSummary] = useState([]);
  const [tableHeight, setTableHeight] = useState('calc(100vh - 280px)');
  const chipContainerRef = useRef(null);
  
  useEffect(() => {
    const typesObject = positions.reduce((acc, position) => {
      if (!acc[position.transporterType]) {
        acc[position.transporterType] = { name: position.transporterType, total: 0 };
      }
      acc[position.transporterType].total += 1;
      return acc;
    }, {});
    setTypeSummary(Object.values(typesObject));
  }, [positions]);

  useEffect(() => {
    if (chipContainerRef.current) {
      const chipHeight = chipContainerRef.current.offsetHeight;
      setTableHeight(`calc(100vh - ${chipHeight + 280}px)`); // Viewport height minus stats cards, navbar, and spacing
    }
  }, [typeSummary]);

  const fetchPositions = async () => {
    setLoading(true);
    var result = await getDevicePositions();
    setPositions(result);
    setActive(countRecentDevices(result, settings.onlineInterval));
    setMovement(countDevicesInMovement(result));
    setLoading(false);
  };

  const calculateReference = async () => {
    try {
      var result = await getTransportersInGeofence();
      setInGeofence(result.length);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      calculateReference();
      fetchPositions();
    }
  }, [isAuthenticated]);

  const handleSelected = (selected) => {
    setSelectedTransporter(selected);
  };

  return (
    <ArgonBox py={1}>
        <Grid container spacing={3} mb={1}>
            <Grid item size={{xs: 12, md:6, lg:3}}>
                <DetailedStatisticsCard
                    title={t("dashboard.totalTitle")}
                    count={positions.length}
                    icon={{ color: "info", component: <i className="ni ni-map-big" /> }}
                    percentage={{ color: "success", hide: true }}
                />
            </Grid>
            <Grid item size={{xs: 12, md:6, lg:3}}>
                <DetailedStatisticsCard
                    title={t("dashboard.activeTitle")}
                    count={active}
                    icon={{ color: "error", component: <i className="ni ni-watch-time" /> }}
                    percentage={{ color: "success", count: `${getPercentage(active, positions.length)}%` }}
                />
            </Grid>
            <Grid item size={{xs:12, md:6, lg:3}}>
                <DetailedStatisticsCard
                    title={t("dashboard.movementTitle")}
                    count={movement}
                    icon={{ color: "success", component: <i className="ni ni-button-play" /> }}
                    percentage={{ color: "error", count: `${getPercentage(movement, positions.length)}%` }}
                />
            </Grid>
            <Grid item size={{xs: 12, md:6, lg:3}}>
                <DetailedStatisticsCard
                    title={t("dashboard.inGeofence")}
                    count={inGeofence}
                    icon={{
                      color: "warning", 
                      onClick: () => setShowGeofence(!showGeofence),
                      component: <i className="ni ni-pin-3" /> }}
                    percentage={{ color: "success", count: `${getPercentage(inGeofence, positions.length)}%` }}
                />
            </Grid>
        </Grid>
        <Grid container spacing={3}>
            <Grid item size={{xs: 12, lg:9}}>
            <MapControlStyle>
                <GeneralMap 
                    mapType={settings.maps} 
                    positions={positions} 
                    mapKey={settings.mapsKey}
                    selectedMarker={selectedTransporter}
                    geofences={geofences}
                    showGeofence={showGeofence}
                    handleSelected={handleSelected}
                    height="calc(100vh - 280px)"/>
                <RefreshCounter 
                    settings={settings} 
                    fetchPositions={fetchPositions}
                    calculateReference={calculateReference} />
            </MapControlStyle>
            </Grid>
            <Grid item size={{xs: 12, lg:3}}>
                <ArgonBox ref={chipContainerRef} mb={2} display="flex" flexWrap="wrap" gap={1}>
                    {typeSummary.map(({ name, total }) => (
                        <Chip 
                            key={name}
                            label={`${t(`transporterTypes.${cleanString(name)}`)}: ${total}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    ))}
                </ArgonBox>
                <TransportersTable 
                    transporters={positions} 
                    selected={selectedTransporter}
                    handleSelected={handleSelected} 
                    searchQuery={searchQuery}
                    maxHeight={tableHeight}/>
            </Grid>
        </Grid>
    </ArgonBox>
  );
}

Transporters.propTypes = {
    searchQuery: PropTypes.string,
    settings: PropTypes.object,
    geofences: PropTypes.array,
    setShowGeofence: PropTypes.func,
    showGeofence: PropTypes.bool
};

export default Transporters;
