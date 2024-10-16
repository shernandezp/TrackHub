import React, { useState, useEffect } from 'react';
import OSMClusteredMap from 'controls/Maps/OSM/OSMClusteredMap';
import GoogleClusteredMap from '../Google/GoogleClusteredMap';
import PropTypes from 'prop-types';
import '../css/map.css';

function GeneralMap({ mapType, positions, mapKey, selectedMarker, handleSelected }) {
    const [markers, setMarkers] = useState([]);
    useEffect(() => {
        const fetchMarkers = async () => {
            const markers = positions.map(item => ({
                lat: item.latitude,
                lng: item.longitude,
                rotation: item.course,
                name: item.deviceName,
                dateTime: item.deviceDateTime,
                speed: item.speed,
                text: item.speed > 0 ? 'M' : 'D',
            }));
            setMarkers(markers);
        };
        fetchMarkers();
      }, [positions]);

    return (
        <div className="map-container">
            {mapType === 'OSM' ? (
                <OSMClusteredMap 
                    markers={markers} 
                    selectedMarker={selectedMarker}
                    />
            ) : (
                mapType === 'Google' && 
                    <GoogleClusteredMap 
                        markers={markers} 
                        mapKey={mapKey}
                        selectedMarker={selectedMarker} 
                        handleSelected={handleSelected} />
            )}
        </div>
    );
};

GeneralMap.propTypes = {
    mapType: PropTypes.oneOf(['OSM', 'Google']).isRequired,
    positions: PropTypes.array.isRequired,
    mapKey: PropTypes.string,
    selectedMarker: PropTypes.string,
    handleSelected: PropTypes.func,
};

export default GeneralMap;