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

import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { formatDateTime } from "utils/dateUtils";

import { useEffect, useState, useRef } from 'react';
import { useMap } from 'react-leaflet';
import PropTypes from 'prop-types';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useTranslation } from 'react-i18next';
import { createSvgIcon } from 'controls/Maps/utils/imageUtils';

const MarkerCluster = ({ markers, selectedMarker }) => {
    const { t } = useTranslation();
    const map = useMap();
    const markerGroupRef = useRef();
    const [leafletMarkers, setLeafletMarkers] = useState({});

    useEffect(() => {
        const markerGroup = L.markerClusterGroup();
        markerGroupRef.current = markerGroup;
        const newLeafletMarkers = {};

        markers.forEach((marker) => {
            const myIcon = L.divIcon({
                className: 'my-icon',
                html: createSvgIcon(marker.rotation, marker.text),
                iconSize: [28, 30],
                iconAnchor: [22, 44],
                popupAnchor: [-3, -76],
            });

            const leafletMarker = L.marker([marker.lat, marker.lng], { icon: myIcon });
            leafletMarker.bindPopup(
                `${t('transporterMap.name')}: ${marker.name}
                <br>${t('transporterMap.dateTime')}: ${formatDateTime(marker.dateTime)}
                <br>${t('transporterMap.speed')}: ${marker.speed}`);
            markerGroup.addLayer(leafletMarker);

            newLeafletMarkers[marker.name] = leafletMarker;
        });

        map.addLayer(markerGroup);
        setLeafletMarkers(newLeafletMarkers);

        return () => {
            map.removeLayer(markerGroup);
        };
    }, [map, markers]);

    useEffect(() => {
        if (selectedMarker) {
            const leafletMarker = leafletMarkers[selectedMarker];
            if (leafletMarker && markerGroupRef.current) {
                markerGroupRef.current.zoomToShowLayer(leafletMarker, () => {
                    map.setView(leafletMarker.getLatLng());
                    leafletMarker.openPopup();
                });
            }
        }
    }, [selectedMarker, leafletMarkers]);

    return null;
};

MarkerCluster.propTypes = {
    markers: PropTypes.array.isRequired,
    selectedMarker: PropTypes.string,
};

export default MarkerCluster;