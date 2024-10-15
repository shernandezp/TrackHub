import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { formatDateTime } from "utils/dateUtils";

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import PropTypes from 'prop-types';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useTranslation } from 'react-i18next';
import { createSvgIcon } from 'controls/Maps/utils/imageUtils';

const MarkerCluster = ({ markers, icon }) => {
    const { t } = useTranslation();
    const map = useMap();
        useEffect(() => {
            const markerGroup = L.markerClusterGroup();
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
            });
            map.addLayer(markerGroup);
    
            return () => {
                map.removeLayer(markerGroup);
            };
        }, [map, markers, icon]);
    
        return null;
    };
    
    MarkerCluster.propTypes = {
        markers: PropTypes.array.isRequired,
        icon: PropTypes.object
    };

export default MarkerCluster;