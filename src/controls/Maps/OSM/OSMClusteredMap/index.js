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

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import GeofencePolygon from 'controls/Maps/OSM/GeofencePolygon';
import MarkerCluster from 'controls/Maps/OSM/MarkerCluster';
import UserLocation from "controls/Maps/UserLocation";
import { OSMScaleControl } from 'controls/Maps/shared/ScaleControl';
import { OSMFullscreenControl } from 'controls/Maps/shared/FullscreenControl';
import { OSMMeasurementTool } from 'controls/Maps/shared/MeasurementTool';
import MapProviderContext, { OSM_PROVIDER } from 'controls/Maps/core/MapProviderContext';
import PoiLayer from 'controls/Maps/core/PoiLayer';
import TrailLayer from 'controls/Maps/core/TrailLayer';
import { OSM_LIGHT_TILE, OSM_DARK_TILE } from 'controls/Maps/utils/darkMapStyles';
import PropTypes from 'prop-types';
import L from 'leaflet';

// Keeps the selected unit centered across refreshes until the user pans.
const FollowController = ({ followUnit, markers, onFollowDisengage }) => {
    const map = useMap();

    useEffect(() => {
        if (!followUnit) return;
        const marker = markers.find(m => m.name === followUnit);
        if (marker) {
            map.setView(L.latLng(marker.lat, marker.lng), map.getZoom(), { animate: true });
        }
    }, [followUnit, markers, map]);

    useEffect(() => {
        if (!followUnit || !onFollowDisengage) return undefined;
        const handler = () => onFollowDisengage();
        map.on('dragstart', handler);
        return () => {
            map.off('dragstart', handler);
        };
    }, [followUnit, onFollowDisengage, map]);

    return null;
};

FollowController.propTypes = {
    followUnit: PropTypes.string,
    markers: PropTypes.array,
    onFollowDisengage: PropTypes.func
};

const OSMClusteredMap = ({
    markers,
    selectedMarker,
    geofences,
    showGeofence,
    handleSelected,
    enableScale = true,
    enableFullscreen = true,
    enableMeasurement = true,
    pois = [],
    showPois = false,
    trail = [],
    showTrail = false,
    followUnit = null,
    onFollowDisengage,
    darkMode = false,
    viewportThreshold = 1000,
    height = "70vh"
}) => {
    const [bounds, setBounds] = useState(null);
    const [userLocation, setUserLocation] = useState({
        lat: parseFloat(process.env.REACT_APP_DEFAULT_LAT),
        lng: parseFloat(process.env.REACT_APP_DEFAULT_LNG)
    });
    const mapRef = useRef();
    const boundsSetRef = useRef(false);

    useEffect(() => {
        if (markers.length > 0) {
            const newBounds = markers.map(marker => [marker.lat, marker.lng]);
            setBounds(newBounds);
        }
    }, [markers]);

    useEffect(() => {
        if (selectedMarker && mapRef.current) {
            const map = mapRef.current;
            const marker = markers.find(m => m.name === selectedMarker);
            if (marker) {
                const latLng = L.latLng(marker.lat, marker.lng);
                map.setView(latLng, map.getZoom());
            }
        }
        // Center on selection change only; refresh cycles must not recenter.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedMarker]);

    const ChangeView = ({ bounds }) => {
        const map = useMap();

        useEffect(() => {
            if (bounds && bounds.length > 0 && !boundsSetRef.current) {
                const newBounds = L.latLngBounds(bounds);
                map.fitBounds(newBounds);
                boundsSetRef.current = true;
            }
        }, [bounds, map]);

        return null;
    };

    ChangeView.propTypes = {
        bounds: PropTypes.array
    };

    const tile = darkMode ? OSM_DARK_TILE : OSM_LIGHT_TILE;

    return (
        <div>
            <UserLocation setUserLocation={setUserLocation} />
            <MapProviderContext.Provider value={OSM_PROVIDER}>
                <MapContainer
                    center={userLocation}
                    zoom={13}
                    preferCanvas={true}
                    style={{ height: height, width: "100%" }}
                    ref={mapRef}>
                    <TileLayer
                        key={darkMode ? 'dark' : 'light'}
                        url={tile.url}
                        attribution={tile.attribution}
                        className={tile.className}
                    />
                    <MarkerCluster
                        markers={markers}
                        selectedMarker={selectedMarker}
                        handleSelected={handleSelected}
                        viewportThreshold={viewportThreshold} />
                    {bounds && <ChangeView bounds={bounds} />}
                    {showGeofence && geofences.map((geofence, index) => (
                        <GeofencePolygon key={index} geofence={geofence} />
                    ))}
                    {showPois && <PoiLayer pois={pois} />}
                    {showTrail && trail.length > 1 && <TrailLayer points={trail} />}
                    <FollowController
                        followUnit={followUnit}
                        markers={markers}
                        onFollowDisengage={onFollowDisengage} />
                    {enableScale && <OSMScaleControl position="bottomleft" imperial={false} />}
                    {enableFullscreen && <OSMFullscreenControl position="topleft" />}
                    {enableMeasurement && <OSMMeasurementTool position="topleft" unit="metric" enabled={true} />}
                </MapContainer>
            </MapProviderContext.Provider>
        </div>
    );
};

OSMClusteredMap.propTypes = {
    markers: PropTypes.array.isRequired,
    selectedMarker: PropTypes.string,
    geofences: PropTypes.array,
    showGeofence: PropTypes.bool,
    handleSelected: PropTypes.func,
    enableScale: PropTypes.bool,
    enableFullscreen: PropTypes.bool,
    enableMeasurement: PropTypes.bool,
    pois: PropTypes.array,
    showPois: PropTypes.bool,
    trail: PropTypes.array,
    showTrail: PropTypes.bool,
    followUnit: PropTypes.string,
    onFollowDisengage: PropTypes.func,
    darkMode: PropTypes.bool,
    viewportThreshold: PropTypes.number,
    height: PropTypes.string
};

export default OSMClusteredMap;
