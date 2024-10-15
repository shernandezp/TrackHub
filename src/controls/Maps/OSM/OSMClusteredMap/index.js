import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerCluster from 'controls/Maps/OSM/MarkerCluster';
import PropTypes from 'prop-types';

const OSMClusteredMap = ({markers, selectedMarker}) => {
    const bounds = markers.length > 0 ? markers.map(marker => [marker.lat, marker.lng]) : [];
    const ChangeView = ({ bounds }) => {
        const map = useMap();
        useEffect(() => {
            if (bounds.length > 0) {
                map.fitBounds(bounds);
            }
        }, [bounds, map]);
        return null;
    }

    ChangeView.propTypes = {
        bounds: PropTypes.array.isRequired
    }

    return (
    <MapContainer zoom={13} style={{ height: "100vh", width: "100%" }}>
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <MarkerCluster markers={markers} selectedMarker={selectedMarker}/>
        <ChangeView bounds={bounds} />
    </MapContainer>);
};

OSMClusteredMap.propTypes = {
    markers: PropTypes.array.isRequired,
    selectedMarker: PropTypes.string
};

export default OSMClusteredMap;