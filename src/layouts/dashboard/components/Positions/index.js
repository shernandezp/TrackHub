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

import React, { useState, useEffect, useContext, useMemo } from 'react';
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Icon from "@mui/material/Icon";
import ArgonBox from "components/ArgonBox";
import ArgonButton from "components/ArgonButton";
import ArgonTypography from "components/ArgonTypography";
import FilterNavbar from 'controls/Navbars/FilterNavbar';
import TripList from "layouts/dashboard/components/TripList";
import TripsMap from "layouts/dashboard/components/TripsMap";
import PlaybackControls from "layouts/dashboard/components/Positions/PlaybackControls";
import useRouterService from "services/router";
import useTransporterService from "services/transporter";
import useAccountFeatureService from 'services/accountFeatures';
import useForm from 'controls/Dialogs/useForm';
import { usePlayback } from 'layouts/dashboard/utils/playback';
import { downloadCsv, sanitizeFileNamePart } from 'utils/csvUtils';
import { LoadingContext } from 'LoadingContext';
import { useTranslation } from 'react-i18next';
import { useAuth } from "AuthContext";
import { useArgonController } from 'context';

const POSITION_HISTORY_FEATURE_KEY = 'gps.positionHistory';

function Positions({settings, showGeofence, geofences}) {
  const { t } = useTranslation();
  const { getTripsByTransporter } = useRouterService();
  const { getTransportersByUser } = useTransporterService();
  const { getAccountFeatures } = useAccountFeatureService();
  const { setLoading } = useContext(LoadingContext);
  const { isAuthenticated } = useAuth();
  const [controller] = useArgonController();
  const { darkMode } = controller;
  const [trips, setTrips] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [source, setSource] = useState('PROVIDER');
  const [loadedQuery, setLoadedQuery] = useState(null);
  const [values, handleChange, setValues, setErrors, validate, errors] = useForm({});

  const fetchPositions = async () => {
    setLoading(true);
    const usedSource = historyEnabled ? source : undefined;
    var result = await getTripsByTransporter(
      values.selectedItem,
      values.startDate,
      values.endDate,
      usedSource) || [];
    setTrips(result);
    setLoadedQuery({
      transporterId: values.selectedItem,
      from: values.startDate,
      to: values.endDate,
      source: usedSource || 'PROVIDER'
    });
    setSelectedTrip(null);
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

  const fetchFeatures = async () => {
    if (!settings?.accountId) return;
    const features = await getAccountFeatures(settings.accountId) || [];
    const feature = features.find(item => item.featureKey === POSITION_HISTORY_FEATURE_KEY);
    setHistoryEnabled(!!feature?.enabled);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransporters();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeatures();
    }
  }, [isAuthenticated, settings?.accountId]);

  const handleSelected = (selected) => {
    setSelectedTrip(selected);
  };

  const handleSearch = async () => {
    if (validate(['startDate', 'endDate', 'selectedItem'])) {
      await fetchPositions();
    }
  };

  const handleExport = () => {
    if (trips.length === 0 || !loadedQuery) return;
    const transporter = transporters.find(item => item.value === loadedQuery.transporterId);
    const transporterName = transporter ? transporter.label : loadedQuery.transporterId;
    const headers = [
      t('replay.exportTransporter'),
      t('replay.exportTrip'),
      t('replay.exportTimestamp'),
      t('replay.exportLatitude'),
      t('replay.exportLongitude'),
      t('replay.exportSpeed'),
      t('replay.exportAddress')
    ];
    const rows = trips.flatMap(trip => (trip.points || []).map(point => [
      transporterName,
      trip.tripId,
      point.deviceDateTime,
      point.latitude,
      point.longitude,
      point.speed,
      point.address || ''
    ]));
    const filename = [
      'replay',
      sanitizeFileNamePart(transporterName),
      loadedQuery.source,
      sanitizeFileNamePart(loadedQuery.from),
      sanitizeFileNamePart(loadedQuery.to)
    ].filter(Boolean).join('_');
    downloadCsv(`${filename}.csv`, headers, rows);
  };

  const selectedTripPoints = useMemo(() => {
    if (!selectedTrip) return null;
    const trip = trips.find(item => item.tripId === selectedTrip);
    return trip ? trip.points : null;
  }, [selectedTrip, trips]);

  const playback = usePlayback(selectedTripPoints);

  return (
    <ArgonBox py={1}>
      <Grid container spacing={3} mb={1}>
        <Grid item size={{xs:12, lg:12}}>
          <FilterNavbar
            list={transporters}
            values={values}
            handleChange={handleChange}
            errors={errors}
            handleSearch={handleSearch}
          />
          <ArgonBox display="flex" alignItems="center" gap={1} mb={1}>
            {historyEnabled && (
              <>
                <ArgonTypography variant="caption" fontWeight="bold">
                  {t('replay.source')}
                </ArgonTypography>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={source}
                  aria-label={t('replay.source')}
                  onChange={(event, value) => value && setSource(value)}>
                  <ToggleButton value="PROVIDER">{t('replay.sourceProvider')}</ToggleButton>
                  <ToggleButton value="STORED">{t('replay.sourceTrackHub')}</ToggleButton>
                </ToggleButtonGroup>
              </>
            )}
            <ArgonBox ml="auto">
              <ArgonButton
                variant="contained"
                color="primary"
                size="small"
                disabled={trips.length === 0}
                onClick={handleExport}>
                <Icon>download</Icon>&nbsp;{t('replay.export')}
              </ArgonButton>
            </ArgonBox>
          </ArgonBox>
        </Grid>
      </Grid>
      <Grid container spacing={3}>
        <Grid item size={{xs: 12, lg:9}}>
          <TripsMap
            mapType={settings.maps}
            mapKey={settings.mapsKey}
            trips={trips}
            selectedTrip={selectedTrip}
            geofences={geofences}
            showGeofence={showGeofence}
            handleSelected={handleSelected}
            playbackPosition={selectedTrip ? playback.position : null}
            darkMode={darkMode}
            height="calc(100vh - 280px)"/>
          {selectedTrip && playback.hasTimeline && (
            <PlaybackControls
              playing={playback.playing}
              toggle={playback.toggle}
              speed={playback.speed}
              setSpeed={playback.setSpeed}
              progress={playback.progress}
              seek={playback.seek}
            />
          )}
        </Grid>
        <Grid item size={{xs:12, lg:3}}>
          <TripList
            trips={trips}
            filters={values}
            selectedTrip={selectedTrip}
            handleSelected={handleSelected}
            maxHeight="calc(100vh - 280px)"/>
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
