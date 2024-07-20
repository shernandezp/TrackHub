import React from 'react';
import OSMClusteredMap from 'controls/Maps/OSM/OSMClusteredMap';
import GoogleClusteredMap from '../Google/GoogleClusteredMap';
import PropTypes from 'prop-types';
import '../css/map.css';

const positionOSM = [51.505, -0.09] // for Open Street Maps
const positionGoogle = { lat: 51.505, lng: -0.09 } // for Google Maps

const GeneralMap = ({ mapType }) => {
    const markers = [
        { lat: 51.505, lng: -0.09, rotation: 45 },
        { lat: 51.51, lng: -0.1, rotation: 90 },
        { lat: 51.49, lng: -0.05, rotation: 90 }
    ];
 
    return (
        <div className="map-container">
            {mapType === 'OSM' ? (
                <OSMClusteredMap center={positionOSM} markers={markers}/>
            ) : (
                mapType === 'Google' && <GoogleClusteredMap markers={markers} center={positionGoogle} />
            )}
        </div>
    );
};

GeneralMap.propTypes = {
    mapType: PropTypes.oneOf(['OSM', 'Google']).isRequired
};

export default GeneralMap;