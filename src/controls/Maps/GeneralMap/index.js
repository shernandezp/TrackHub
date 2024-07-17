import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { GoogleMap, LoadScript, Marker as GoogleMarker, MarkerClusterer, InfoWindow } from '@react-google-maps/api';
import L from 'leaflet';
import 'leaflet.markercluster';
import PropTypes from 'prop-types';

const positionOSM = [51.505, -0.09] // for Open Street Maps
const positionGoogle = { lat: 51.505, lng: -0.09 } // for Google Maps

function createSvgIcon(rotation, format = 'svg') {
    const svg = `
        <svg width="50" height="100" viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Group all elements and apply rotation transform -->
        <g transform="rotate(${rotation}, 50, 100)">
            <!-- Car Body -->
            <rect x="20" y="20" width="60" height="160" fill="#000" stroke="#fff" stroke-width="2"/>
            <rect x="30" y="30" width="40" height="60" fill="#aaa" stroke="#fff" stroke-width="2"/>
            <rect x="30" y="110" width="40" height="60" fill="#aaa" stroke="#fff" stroke-width="2"/>
            <circle cx="30" cy="10" r="10" fill="#333" stroke="#fff" stroke-width="2"/>
            <circle cx="70" cy="10" r="10" fill="#333" stroke="#fff" stroke-width="2"/>
            <circle cx="30" cy="190" r="10" fill="#333" stroke="#fff" stroke-width="2"/>
            <circle cx="70" cy="190" r="10" fill="#333" stroke="#fff" stroke-width="2"/>
        </g>
        </svg>`;

    if (format === 'dataURL') {
        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
    return svg;
}

const MarkerCluster = ({ markers, icon }) => {
const map = useMap();

    useEffect(() => {
        const markerGroup = L.markerClusterGroup();
        markers.forEach((marker) => {
            const myIcon = L.divIcon({
                className: 'my-icon',
                html: createSvgIcon(marker.rotation),
                iconSize: [28, 30],
                iconAnchor: [22, 44],
                popupAnchor: [-3, -76],
            });

            const leafletMarker = L.marker([marker.lat, marker.lng], { icon: myIcon });
            leafletMarker.bindPopup('A pretty CSS3 popup. <br /> Easily customizable.');
            markerGroup.addLayer(leafletMarker);
        });
        map.addLayer(markerGroup);

        return () => {
            map.removeLayer(markerGroup);
        };
    }, [map, markers, icon]);

    return null;
};

MarkerCluster.propTypes = {
    markers: PropTypes.array.isRequired,
    icon: PropTypes.object
};

const GeneralMap = ({ mapType }) => {
    const markers = [
        { lat: 51.505, lng: -0.09, rotation: 45 },
        { lat: 51.51, lng: -0.1, rotation: 90 },
        { lat: 51.49, lng: -0.05, rotation: 90 }
    ];

    const [selectedMarker, setSelectedMarker] = useState(null);

    return (
        <>
            {mapType === 'OSM' && (
                <MapContainer center={positionOSM} zoom={13} style={{ height: "100vh", width: "100%" }}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <MarkerCluster markers={markers}/>
                </MapContainer>
            )}

            {mapType === 'Google' && (
                <LoadScript googleMapsApiKey="key">
                    <GoogleMap mapContainerStyle={{ height: "100vh", width: "100%" }} center={positionGoogle} zoom={10}>
                        <MarkerClusterer>
                            {(clusterer) =>
                                markers.map((marker, index) => (
                                    <GoogleMarker
                                        key={index}
                                        position={{ lat: marker.lat, lng: marker.lng }}
                                        clusterer={clusterer}
                                        onClick={() => {
                                            setSelectedMarker({ lat: marker.lat, lng: marker.lng });
                                        }}
                                        icon={{
                                            url: createSvgIcon(marker.rotation, 'dataURL'),
                                            scaledSize: new window.google.maps.Size(50, 50),
                                        }}
                                    >
                                        {selectedMarker && selectedMarker.lat === marker.lat && selectedMarker.lng === marker.lng && (
                                            <InfoWindow
                                                position={{ lat: marker.lat, lng: marker.lng }}
                                                onCloseClick={() => {
                                                    setSelectedMarker(null);
                                                }}
                                            >
                                                <div>A pretty CSS3 popup. <br /> Easily customizable.</div>
                                            </InfoWindow>
                                        )}
                                    </GoogleMarker>
                                ))
                            }
                        </MarkerClusterer>
                    </GoogleMap>
                </LoadScript>
            )}
        </>
    );
};

GeneralMap.propTypes = {
    mapType: PropTypes.oneOf(['OSM', 'Google']).isRequired
};

export default GeneralMap;