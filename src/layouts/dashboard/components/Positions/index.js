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

import React, { useState, useEffect, useContext  } from 'react';
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import ArgonBox from "components/ArgonBox";
import FilterNavbar from 'controls/Navbars/FilterNavbar';
import TripList from "layouts/dashboard/components/TripList";
import TripsMap from "layouts/dashboard/components/TripsMap";
import useRouterService from "services/router";
import useTransporterService from "services/transporter";
import useForm from 'controls/Dialogs/useForm';
import { LoadingContext } from 'LoadingContext';
import { useAuth } from "AuthContext";

function Positions({settings, showGeofence, geofences}) {
  const { getTripsByTransporter } = useRouterService();
  const { getTransportersByUser } = useTransporterService();
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();
  const [trips, setTrips] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});

  const fetchPositions = async () => {
    setLoading(true);
    var result = await getTripsByTransporter(
      values.selectedItem, 
      values.startDate,
      values.endDate);
    setTrips(result);
    setErrors({});
    setLoading(false);
  };

  const fetchTransporters = async () => {
    setLoading(true);
    var result = await getTransportersByUser();
    setTransporters(result.map(transporter => ({
      value: transporter.transporterId,
      label: transporter.name
    })));
    setValues({selectedItem: result.length > 0 ? result[0].transporterId : ''});
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransporters();
    }
  }, [isAuthenticated]);

  const handleSelected = (selected) => {
    setSelectedTrip(selected);
  };

  const handleSearch = async () => {
    if (validate(['startDate', 'endDate', 'selectedItem'])) {
      await fetchPositions();
    }
  };

  return (
    <ArgonBox py={3}>
      <Grid container spacing={3} mb={3}>
        <Grid item size={{xs:12, lg:12}}>
          <FilterNavbar 
            list={transporters}
            values={values}
            handleChange={handleChange}
            errors={errors}
            handleSearch={handleSearch}
          />
        </Grid>
      </Grid>
      <Grid container spacing={3} mb={3}>
        <Grid item size={{xs: 12, lg:9}}>
          <TripsMap 
            mapType={settings.maps} 
            mapKey={settings.mapsKey}
            trips={trips} 
            selectedTrip={selectedTrip}
            geofences={geofences}
            showGeofence={showGeofence}
            handleSelected={handleSelected}/>
        </Grid>
        <Grid item size={{xs:12, lg:3}}>
          <TripList 
            trips={trips}
            filters={values} 
            selectedTrip={selectedTrip}
            handleSelected={handleSelected}/>
        </Grid>
      </Grid>
    </ArgonBox>
  );
}

Positions.propTypes = {
    settings: PropTypes.object,
    showGeofence: PropTypes.bool,
    geofences: PropTypes.array
};

export default Positions;
