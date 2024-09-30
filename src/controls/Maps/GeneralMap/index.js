import React, { useState, useEffect, useContext } from 'react';
import OSMClusteredMap from 'controls/Maps/OSM/OSMClusteredMap';
import GoogleClusteredMap from '../Google/GoogleClusteredMap';
import PropTypes from 'prop-types';
import '../css/map.css';

const positionGoogle = { lat: 51.505, lng: -0.09 } // for Google Maps

function GeneralMap({ mapType, positions }) {
    const [markers, setMarkers] = useState([]);

    useEffect(() => {
        const fetchMarkers = async () => {
            const markers = positions.map(item => ({
                lat: item.latitude,
                lng: item.longitude,
                rotation: item.course,
                name: item.deviceName,
                dateTime: item.deviceDateTime
            }));
            setMarkers(markers);
        };
        fetchMarkers();
      }, [positions]);

    return (
        <div className="map-container">
            {mapType === 'OSM' ? (
                <OSMClusteredMap markers={markers}/>
            ) : (
                mapType === 'Google' && <GoogleClusteredMap markers={markers} center={positionGoogle} />
            )}
        </div>
    );
};

GeneralMap.propTypes = {
    mapType: PropTypes.oneOf(['OSM', 'Google']).isRequired,
    positions: PropTypes.array.isRequired
};

export default GeneralMap;