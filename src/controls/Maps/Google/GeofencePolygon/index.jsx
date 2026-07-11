import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { getColor } from 'data/colors';
import { Polygon, InfoWindow } from '@react-google-maps/api';

const GeofencePolygon = ({ geofence }) => {
    const [tooltipPosition, setTooltipPosition] = useState(null);

    return (
        <>
            <Polygon
                path={geofence.geom.coordinates.map(({ latitude, longitude }) => ({ lat: latitude, lng: longitude }))}
                options={{
                    strokeColor: '#FF0000',
                    strokeOpacity: 0.8,
                    strokeWeight: 1,
                    fillColor: getColor(geofence.color),
                    fillOpacity: 0.35
                }}
                onMouseOver={(e) => setTooltipPosition({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
                onMouseOut={() => setTooltipPosition(null)} />
            {tooltipPosition && (
                <InfoWindow position={tooltipPosition} options={{ disableAutoPan: true }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                        {geofence.name}
                    </div>
                </InfoWindow>
            )}
        </>
    );
};

GeofencePolygon.propTypes = {
    geofence: PropTypes.shape({
        geom: PropTypes.shape({
            coordinates: PropTypes.arrayOf(
                PropTypes.shape({
                    latitude: PropTypes.number.isRequired,
                    longitude: PropTypes.number.isRequired
                })
            ).isRequired
        }).isRequired,
        color: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired
    }).isRequired,
};

export default GeofencePolygon;