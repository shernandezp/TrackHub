import { useState } from 'react';
import { getColor } from 'data/colors';
import { Polygon, InfoWindow } from '@react-google-maps/api';
import type { MapGeofence } from 'controls/Maps/core/mapTypes';

export interface GeofencePolygonProps {
    geofence: MapGeofence;
}

const GeofencePolygon = ({ geofence }: GeofencePolygonProps) => {
    const [tooltipPosition, setTooltipPosition] = useState<{ lat: number; lng: number } | null>(null);

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
                onMouseOver={(e) => setTooltipPosition({ lat: e.latLng!.lat(), lng: e.latLng!.lng() })}
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

export default GeofencePolygon;
