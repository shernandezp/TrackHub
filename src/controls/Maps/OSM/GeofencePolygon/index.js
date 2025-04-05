import React from 'react';
import { Polygon, Tooltip } from 'react-leaflet';
import PropTypes from 'prop-types';
import { getColor } from 'data/colors';

const GeofencePolygon = ({ geofence }) => {
    return (
        <Polygon
            
            positions={geofence.geom.coordinates.map(coord => [coord.latitude, coord.longitude])}
            pathOptions={{
                color: 'black',
                fillColor: getColor(geofence.color),
                fillOpacity: 0.5,
                weight: 1
            }}
        >
            <Tooltip>
                <span>{geofence.name}</span>
            </Tooltip>
        </Polygon>
    );
};

GeofencePolygon.propTypes = {
    geofence: PropTypes.shape({
        geofenceId: PropTypes.string.isRequired,
        geom: PropTypes.shape({
            coordinates: PropTypes.arrayOf(
                PropTypes.shape({
                    latitude: PropTypes.number.isRequired,
                    longitude: PropTypes.number.isRequired
                })
            ).isRequired
        }).isRequired,
        color: PropTypes.number.isRequired,
        name: PropTypes.string
    }).isRequired
};

export default GeofencePolygon;