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

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerCluster from 'controls/Maps/OSM/MarkerCluster';
import PropTypes from 'prop-types';

const OSMClusteredMap = ({ markers, selectedMarker }) => {
    const [bounds, setBounds] = useState(null);
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
    }, [selectedMarker, markers]);

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

    return (
        <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            style={{ height: "100vh", width: "100%" }}
            whenCreated={mapInstance => { mapRef.current = mapInstance; }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <MarkerCluster 
                markers={markers} 
                selectedMarker={selectedMarker} />
            {bounds && <ChangeView bounds={bounds} />}
        </MapContainer>
    );
};

OSMClusteredMap.propTypes = {
    markers: PropTypes.array.isRequired,
    selectedMarker: PropTypes.string
};

export default OSMClusteredMap;