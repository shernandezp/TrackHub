import React, { useState } from 'react';
import { GoogleMap, LoadScript, Marker as GoogleMarker, MarkerClusterer, InfoWindow } from '@react-google-maps/api';
import PropTypes from 'prop-types';
import { createSvgIcon } from 'controls/Maps/utils/imageUtils';

const GoogleClusteredMap = ({markers, center}) => {
    const [selectedMarker, setSelectedMarker] = useState(null);

    return (
        <LoadScript googleMapsApiKey="key">
            <GoogleMap mapContainerStyle={{ height: "100vh", width: "100%" }} center={center} zoom={10}>
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
        </LoadScript>);
};

GoogleClusteredMap.propTypes = {
    markers: PropTypes.array.isRequired,
    center: PropTypes.array.isRequired
};

export default GoogleClusteredMap;