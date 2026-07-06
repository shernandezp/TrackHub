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

import React, { useState, useEffect } from 'react';
import OSMClusteredMap from 'controls/Maps/OSM/OSMClusteredMap';
import GoogleClusteredMap from 'controls/Maps/Google/GoogleClusteredMap';
import { getUnitStatus } from 'layouts/dashboard/utils/dashboard';
import { getStatusMarkerColor, getStatusMarkerLabel } from 'controls/Maps/utils/markerUtils';
import PropTypes from 'prop-types';
import 'controls/Maps/css/map.css';

function GeneralMap({
    mapType,
    positions,
    mapKey,
    selectedMarker,
    geofences,
    showGeofence,
    handleSelected,
    onlineInterval,
    pois = [],
    showPois = false,
    trail = [],
    showTrail = false,
    followUnit = null,
    onFollowDisengage,
    darkMode = false,
    viewportThreshold = 1000,
    height = "70vh" }) {

    const [markers, setMarkers] = useState([]);
    useEffect(() => {
        const fetchMarkers = async () => {
            const markers = positions.map(item => {
                const status = getUnitStatus(item, onlineInterval);
                return {
                    id: item.transporterId,
                    lat: item.latitude,
                    lng: item.longitude,
                    rotation: item.course,
                    name: item.deviceName,
                    dateTime: item.deviceDateTime,
                    speed: item.speed,
                    status,
                    color: getStatusMarkerColor(status),
                    text: getStatusMarkerLabel(status),
                    // Additional attributes
                    attributes: item.attributes || {},
                    address: item.address,
                    altitude: item.altitude,
                    city: item.city,
                    country: item.country,
                    state: item.state,
                    transporterType: item.transporterType,
                };
            });
            setMarkers(markers);
        };
        fetchMarkers();
      }, [positions, onlineInterval]);

    return (
        <div className="map-container">
            {mapType === 'OSM' ? (
                <OSMClusteredMap
                    markers={markers}
                    selectedMarker={selectedMarker}
                    geofences={geofences}
                    showGeofence={showGeofence}
                    handleSelected={handleSelected}
                    pois={pois}
                    showPois={showPois}
                    trail={trail}
                    showTrail={showTrail}
                    followUnit={followUnit}
                    onFollowDisengage={onFollowDisengage}
                    darkMode={darkMode}
                    viewportThreshold={viewportThreshold}
                    height={height} />
            ) : (
                mapType === 'Google' &&
                    <GoogleClusteredMap
                        markers={markers}
                        mapKey={mapKey}
                        selectedMarker={selectedMarker}
                        geofences={geofences}
                        showGeofence={showGeofence}
                        handleSelected={handleSelected}
                        pois={pois}
                        showPois={showPois}
                        trail={trail}
                        showTrail={showTrail}
                        followUnit={followUnit}
                        onFollowDisengage={onFollowDisengage}
                        darkMode={darkMode}
                        viewportThreshold={viewportThreshold}
                        height={height} />
            )}
        </div>
    );
};

GeneralMap.propTypes = {
    mapType: PropTypes.oneOf(['OSM', 'Google']).isRequired,
    positions: PropTypes.array.isRequired,
    mapKey: PropTypes.string,
    selectedMarker: PropTypes.string,
    geofences: PropTypes.array,
    showGeofence: PropTypes.bool,
    handleSelected: PropTypes.func,
    onlineInterval: PropTypes.number,
    pois: PropTypes.array,
    showPois: PropTypes.bool,
    trail: PropTypes.array,
    showTrail: PropTypes.bool,
    followUnit: PropTypes.string,
    onFollowDisengage: PropTypes.func,
    darkMode: PropTypes.bool,
    viewportThreshold: PropTypes.number,
    height: PropTypes.string,
};

export default GeneralMap;
