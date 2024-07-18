import { MapContainer, TileLayer } from 'react-leaflet';
import MarkerCluster from 'controls/Maps/OSM/MarkerCluster';
import PropTypes from 'prop-types';

const OSMClusteredMap = ({center, markers}) => {
    return (
    <MapContainer center={center} zoom={13} style={{ height: "100vh", width: "100%" }}>
        <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        <MarkerCluster markers={markers}/>
    </MapContainer>);
};

OSMClusteredMap.propTypes = {
    markers: PropTypes.array.isRequired,
    center: PropTypes.array.isRequired
};

export default OSMClusteredMap;