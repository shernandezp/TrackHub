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
import Trips from "layouts/dashboard/components/Trips";
import useRouterService from "services/router";
import useTransporterService from "services/transporter";
import useForm from 'controls/Dialogs/useForm';
import { toISOStringWithTimezone } from "utils/dateUtils";
import { LoadingContext } from 'LoadingContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from "AuthContext";
import GeneralMap from "layouts/dashboard/components/GeneralMap";

function Positions({searchQuery, settings}) {
  const { t } = useTranslation();
  const { getTripsByTransporter } = useRouterService();
  const { getTransportersByUser } = useTransporterService();
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();
  const [positions, setPositions] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [selectedTransporter, setSelectedTransporter] = useState(null);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});

  const fetchPositions = async () => {
    setLoading(true);
    var result = await getTripsByTransporter(
      values.selectedItem, 
      toISOStringWithTimezone(new Date(values.startDate)),
      toISOStringWithTimezone(new Date(values.endDate)));
    setPositions(result);
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
    setValues({selectedItem: ''});
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransporters();
    }
  }, [isAuthenticated]);

  const handleSelected = (selected) => {
    setSelectedTransporter(selected);
  };

  const handleSearch = async () => {
    if (validate(['startDate', 'endDate', 'selectedItem'])) {
      await fetchPositions();
    }
  };

  return (
    <ArgonBox py={3}>
        <Grid container spacing={3} mb={3}>
            <Grid item xs={12} lg={12}>
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
            <Grid item xs={12} lg={9}>
                <GeneralMap 
                    mapType={settings.maps} 
                    positions={[]} 
                    mapKey={settings.mapsKey}
                    selectedMarker={selectedTransporter}
                    handleSelected={handleSelected}/>
            </Grid>
            <Grid item xs={12} lg={3}>
              <Trips 
                trips={positions}
                filters={values}
                />
            </Grid>
        </Grid>
    </ArgonBox>
  );
}

Positions.propTypes = {
    searchQuery: PropTypes.string,
    settings: PropTypes.object
};

export default Positions;
