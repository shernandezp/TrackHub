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

import React, { useState, useEffect, useContext  } from 'react';
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import TransportersTable from "layouts/dashboard/components/TransportersTable";
import TransporterList from "layouts/dashboard/components/TransporterList";
import useRouterService from "services/router";
import useSettignsService from 'services/settings';
import { LoadingContext } from 'LoadingContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from "AuthContext";
import GeneralMap from "layouts/dashboard/components/GeneralMap";

function Positions({searchQuery}) {
  const { t } = useTranslation();
  const { getDevicePositions } = useRouterService();
  const { getAccountSettings } = useSettignsService();
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();
  const [positions, setPositions] = useState([]);
  const [settings, setSettings] = useState({maps:'OSM', mapsKey:'', refreshMapInterval: 60});
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  
  const fetchPositions = async () => {
    setLoading(true);
    var result = await getDevicePositions();
    var settings = await getAccountSettings();
    setSettings(settings);
    setPositions(result);
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
    <ArgonBox py={3}>
        <Grid container spacing={3} mb={3}>
            <Grid item xs={12} lg={12}>
            <GeneralMap 
                mapType={settings.maps} 
                positions={positions} 
                mapKey={settings.mapsKey}
                selectedMarker={selectedTransporter}
                handleSelected={handleSelected}/>
            </Grid>
        </Grid>
        <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
                <TransportersTable 
                    transporters={positions} 
                    selected={selectedTransporter}
                    handleSelected={handleSelected} 
                    searchQuery={searchQuery}/>
            </Grid>
            <Grid item xs={12} md={4}>
                <TransporterList title={t("dashboard.typesTitle")} positions={positions} />
            </Grid>
        </Grid>
    </ArgonBox>
  );
}

Positions.propTypes = {
    searchQuery: PropTypes.string
};

export default Positions;
