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
import PropTypes from 'prop-types';
import 'controls/Maps/css/map.css';

function GeneralMap({ 
    mapType, 
    positions, 
    mapKey, 
    selectedMarker, 
    geofences,
    showGeofence,
    handleSelected }) {

    const [markers, setMarkers] = useState([]);
    useEffect(() => {
        const fetchMarkers = async () => {
            const markers = positions.map(item => ({
                lat: item.latitude,
                lng: item.longitude,
                rotation: item.course,
                name: item.deviceName,
                dateTime: item.deviceDateTime,
                speed: item.speed,
                text: item.speed > 0 ? 'M' : 'D',
            }));
            setMarkers(markers);
        };
        fetchMarkers();
      }, [positions]);

    return (
        <div className="map-container">
            {mapType === 'OSM' ? (
                <OSMClusteredMap 
                    markers={markers} 
                    selectedMarker={selectedMarker}
                    geofences={geofences}
                    showGeofence={showGeofence} />
            ) : (
                mapType === 'Google' && 
                    <GoogleClusteredMap 
                        markers={markers} 
                        mapKey={mapKey}
                        selectedMarker={selectedMarker}
                        geofences={geofences}
                        showGeofence={showGeofence} 
                        handleSelected={handleSelected} />
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
};

export default GeneralMap;