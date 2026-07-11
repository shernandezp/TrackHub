import { Polygon, Tooltip } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import { getColor } from 'data/colors';
import type { MapGeofence } from 'controls/Maps/core/mapTypes';

export interface GeofencePolygonProps {
    geofence: MapGeofence;
}

const GeofencePolygon = ({ geofence }: GeofencePolygonProps) => {
    const positions: LatLngExpression[] = geofence.geom.coordinates.map(
        coord => [coord.latitude, coord.longitude] as [number, number]
    );
    return (
        <Polygon
            positions={positions}
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

export default GeofencePolygon;
