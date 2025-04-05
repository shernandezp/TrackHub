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
import OSMTripsMap from 'controls/Maps/OSM/OSMTripsMap';
import GoogleTripsMap from 'controls/Maps/Google/GoogleTripsMap';
import { getRandomColor } from "utils/colorUtils";
import PropTypes from 'prop-types';
import 'controls/Maps/css/map.css';

function TripsMap({ 
    mapType, 
    mapKey, 
    trips, 
    selectedTrip, 
    showGeofence,
    geofences,
    handleSelected }) {
    const [polygons, setPolygons] = useState([]);
    useEffect(() => {
        const fetchTrips = async () => {
            const transformedTrips = trips.map(trip => ({
                id: trip.tripId,
                color: getRandomColor(),
                coordinates: trip.points.map(point => [point.latitude, point.longitude])
            }));
            setPolygons(transformedTrips);
        };
        fetchTrips();
      }, [trips]);

    return (
        <div className="map-container">
            {mapType === 'OSM' ? (
                <OSMTripsMap 
                    trips={polygons} 
                    selectedTrip={selectedTrip}
                    showGeofence={showGeofence}
                    geofences={geofences}
                    handleSelected={handleSelected}/>
            ) : (
                mapType === 'Google' && 
                    <GoogleTripsMap 
                        mapKey={mapKey}
                        trips={polygons} 
                        selectedTrip={selectedTrip} 
                        showGeofence={showGeofence}
                        geofences={geofences}
                        handleSelected={handleSelected} />
            )}
        </div>
    );
};

TripsMap.propTypes = {
    mapType: PropTypes.oneOf(['OSM', 'Google']).isRequired,
    trips: PropTypes.array,
    mapKey: PropTypes.string,
    selectedTrip: PropTypes.string,
    showGeofence: PropTypes.bool,
    geofences: PropTypes.array,
    handleSelected: PropTypes.func,
};

export default TripsMap;