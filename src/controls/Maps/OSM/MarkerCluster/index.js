import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import PropTypes from 'prop-types';
import L from 'leaflet';
import 'leaflet.markercluster';
import { createSvgIcon } from 'controls/Maps/utils/imageUtils';

const MarkerCluster = ({ markers, icon }) => {
    const map = useMap();
    
        useEffect(() => {
            const markerGroup = L.markerClusterGroup();
            markers.forEach((marker) => {
                const myIcon = L.divIcon({
                    className: 'my-icon',
                    html: createSvgIcon(marker.rotation),
                    iconSize: [28, 30],
                    iconAnchor: [22, 44],
                    popupAnchor: [-3, -76],
                });
    
                const leafletMarker = L.marker([marker.lat, marker.lng], { icon: myIcon });
                leafletMarker.bindPopup('A pretty CSS3 popup. <br /> Easily customizable.');
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