/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/

import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker as GoogleMarker, MarkerClusterer, InfoWindow } from '@react-google-maps/api';
import PropTypes from 'prop-types';
import { createSvgIcon } from 'controls/Maps/utils/imageUtils';
import { formatDateTime } from "utils/dateUtils";
import { useTranslation } from 'react-i18next';
import 'controls/Maps/css/googleMap.css';

const GoogleClusteredMap = ({ markers, mapKey, selectedMarker, handleSelected }) => {
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
                    mapRef.current.setZoom(16);
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
                                        mapRef.current.setZoom(16);
                                    }
                                    handleSelected(marker.name);
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
    selectedMarker: PropTypes.string,
    handleSelected: PropTypes.func
};

export default GoogleClusteredMap;