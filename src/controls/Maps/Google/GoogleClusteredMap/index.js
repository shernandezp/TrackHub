import React, { useState, useRef } from 'react';
import { GoogleMap, LoadScript, Marker as GoogleMarker, MarkerClusterer, InfoWindow } from '@react-google-maps/api';
import PropTypes from 'prop-types';
import { createSvgIcon } from 'controls/Maps/utils/imageUtils';
import { formatDateTime } from "utils/dateUtils";
import { useTranslation } from 'react-i18next';

const GoogleClusteredMap = ({markers, mapKey}) => {
    const [selectedMarker, setSelectedMarker] = useState(null);
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
                                        <div>
                                            <div>{`${t('transporterMap.name')}: ${marker.name}`}</div>
                                            <div>{`${t('transporterMap.dateTime')}: ${formatDateTime(marker.dateTime)}`}</div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </GoogleMarker>
                        ))
                    }
                </MarkerClusterer>
            </GoogleMap>
        </LoadScript>);
};

GoogleClusteredMap.propTypes = {
    markers: PropTypes.array.isRequired,
    mapKey: PropTypes.string
};

export default GoogleClusteredMap;