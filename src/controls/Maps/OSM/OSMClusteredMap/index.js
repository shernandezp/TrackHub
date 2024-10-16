import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import MarkerCluster from 'controls/Maps/OSM/MarkerCluster';
import PropTypes from 'prop-types';

const OSMClusteredMap = ({ markers, selectedMarker }) => {
    const [bounds, setBounds] = useState(null);
    const mapRef = useRef();
    const boundsSetRef = useRef(false);

    useEffect(() => {
        if (markers.length > 0) {
            const newBounds = markers.map(marker => [marker.lat, marker.lng]);
            setBounds(newBounds);
        }
    }, [markers]);

    useEffect(() => {
        if (selectedMarker && mapRef.current) {
            const map = mapRef.current;
            const marker = markers.find(m => m.name === selectedMarker);
            if (marker) {
                const latLng = L.latLng(marker.lat, marker.lng);
                map.setView(latLng, map.getZoom());
            }
        }
    }, [selectedMarker, markers]);

    const ChangeView = ({ bounds }) => {
        const map = useMap();

        useEffect(() => {
            if (bounds && bounds.length > 0 && !boundsSetRef.current) {
                const newBounds = L.latLngBounds(bounds);
                map.fitBounds(newBounds);
                boundsSetRef.current = true;
            }
        }, [bounds, map]);

        return null;
    };

    ChangeView.propTypes = {
        bounds: PropTypes.array
    };

    return (
        <MapContainer
            center={[51.505, -0.09]}
            zoom={13}
            style={{ height: "100vh", width: "100%" }}
            whenCreated={mapInstance => { mapRef.current = mapInstance; }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <MarkerCluster 
                markers={markers} 
                selectedMarker={selectedMarker} />
            {bounds && <ChangeView bounds={bounds} />}
        </MapContainer>
    );
};

OSMClusteredMap.propTypes = {
    markers: PropTypes.array.isRequired,
    selectedMarker: PropTypes.string
};

export default OSMClusteredMap;