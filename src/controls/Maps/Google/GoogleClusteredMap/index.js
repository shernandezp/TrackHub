import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker as GoogleMarker, MarkerClusterer, InfoWindow } from '@react-google-maps/api';
import PropTypes from 'prop-types';
import { createSvgIcon } from 'controls/Maps/utils/imageUtils';
import { formatDateTime } from "utils/dateUtils";
import { useTranslation } from 'react-i18next';
import 'controls/Maps/css/googleMap.css';

const GoogleClusteredMap = ({ markers, mapKey, selectedMarker }) => {
    const [internalSelectedMarker, setInternalSelectedMarker] = useState(null);
    const { t } = useTranslation();
    const mapRef = useRef();

    const handleMapLoad = (map) => {
        mapRef.current = map;
        const bounds = new window.google.maps.LatLngBounds();
        markers.forEach(marker => {
            bounds.extend({ lat: marker.lat, lng: marker.lng });
        });
        map.fitBounds(bounds);
    };

    useEffect(() => {
        if (selectedMarker) {
            const marker = markers.find(m => m.name === selectedMarker);
            if (marker) {
                setInternalSelectedMarker(marker);
                if (mapRef.current) {
                    mapRef.current.setCenter({ lat: marker.lat, lng: marker.lng });
                    mapRef.current.setZoom(15);
                }
            }
        }
    }, [selectedMarker, markers]);

    return (
        <LoadScript googleMapsApiKey={mapKey}>
            <GoogleMap mapContainerStyle={{ height: "100vh", width: "100%" }} onLoad={handleMapLoad}>
                <MarkerClusterer>
                    {(clusterer) =>
                        markers.map((marker, index) => (
                            <GoogleMarker
                                key={index}
                                position={{ lat: marker.lat, lng: marker.lng }}
                                clusterer={clusterer}
                                onClick={() => {
                                    setInternalSelectedMarker(marker);
                                    if (mapRef.current) {
                                        mapRef.current.setCenter({ lat: marker.lat, lng: marker.lng });
                                        mapRef.current.setZoom(15);
                                    }
                                }}
                                icon={{
                                    url: createSvgIcon(marker.rotation, marker.text, 'dataURL'),
                                    scaledSize: new window.google.maps.Size(50, 50),
                                }}
                            >
                                {internalSelectedMarker && internalSelectedMarker.name === marker.name && (
                                    <InfoWindow
                                        position={{ lat: marker.lat, lng: marker.lng }}
                                        onCloseClick={() => {
                                            setInternalSelectedMarker(null);
                                        }}
                                    >
                                        <div>
                                            <div>{`${t('transporterMap.name')}: ${marker.name}`}</div>
                                            <div>{`${t('transporterMap.dateTime')}: ${formatDateTime(marker.dateTime)}`}</div>
                                            <div>{`${t('transporterMap.speed')}: ${marker.speed}`}</div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </GoogleMarker>
                        ))
                    }
                </MarkerClusterer>
            </GoogleMap>
        </LoadScript>
    );
};

GoogleClusteredMap.propTypes = {
    markers: PropTypes.array.isRequired,
    mapKey: PropTypes.string,
    selectedMarker: PropTypes.string
};

export default GoogleClusteredMap;