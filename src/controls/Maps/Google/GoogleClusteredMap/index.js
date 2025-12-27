/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
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

import PropTypes from 'prop-types';
import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Marker as GoogleMarker, MarkerClusterer, InfoWindow } from '@react-google-maps/api';
import { createSvgIcon } from 'controls/Maps/utils/imageUtils';
import { formatDateTime } from "utils/dateUtils";
import { getWhatsAppShareUrl, getStreetViewUrl } from 'controls/Maps/utils/popupUtils';
import { useTranslation } from 'react-i18next';
import UserLocation from "controls/Maps/UserLocation";
import GeofencePolygon from 'controls/Maps/Google/GeofencePolygon';
import { GoogleScaleControl } from 'controls/Maps/shared/ScaleControl';
import { GoogleFullscreenControl } from 'controls/Maps/shared/FullscreenControl';
import { GoogleMeasurementTool } from 'controls/Maps/shared/MeasurementTool';
import 'controls/Maps/css/googleMap.css';

const GoogleClusteredMap = ({ 
    mapKey, 
    markers, 
    selectedMarker, 
    handleSelected,
    showGeofence,
    geofences,
    enableScale = true,
    enableFullscreen = true,
    enableMeasurement = true
}) => {
    const [internalSelectedMarker, setInternalSelectedMarker] = useState(null);
    const [userLocation, setUserLocation] = useState({
        lat: parseFloat(process.env.REACT_APP_DEFAULT_LAT),
        lng: parseFloat(process.env.REACT_APP_DEFAULT_LNG)
    });
    const { t } = useTranslation();
    const mapRef = useRef();

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

    useEffect(() => {
        if (mapRef.current && markers.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            markers.forEach(marker => {
                bounds.extend({ lat: marker.lat, lng: marker.lng });
            });
            mapRef.current.fitBounds(bounds);
        }
      }, [markers]);

    return (
        <LoadScript googleMapsApiKey={mapKey}>
            <UserLocation setUserLocation={setUserLocation} />
            <GoogleMap mapContainerStyle={{ height: "70vh", width: "100%" }} 
                zoom={6}
                center={userLocation}
                onLoad={map => (mapRef.current = map)}
                options={{ gestureHandling: "greedy" }}>
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
                                }}>
                                {internalSelectedMarker && internalSelectedMarker.name === marker.name && (
                                    <InfoWindow
                                        position={{ lat: marker.lat, lng: marker.lng }}
                                        onCloseClick={() => {
                                            setInternalSelectedMarker(null);
                                            if (handleSelected) {
                                                handleSelected(null);
                                            }
                                        }}
                                    >
                                        <div style={{ minWidth: '240px', fontFamily: 'Arial, sans-serif', fontSize: '13px' }}>
                                            <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '8px', margin: '-8px -8px 6px -8px', borderRadius: '3px 3px 0 0' }}>
                                                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold' }}>{marker.name}</h3>
                                                {marker.transporterType && <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.9 }}>{marker.transporterType}</p>}
                                            </div>
                                            
                                            <div style={{ padding: '0' }}>
                                                <div style={{ marginBottom: '4px' }}>
                                                    <strong style={{ color: '#667eea', fontSize: '12px' }}>⏱ {t('transporterMap.dateTime')}:</strong>{' '}
                                                    <span style={{ fontSize: '12px', color: '#333' }}>{formatDateTime(marker.dateTime)}</span>
                                                </div>
                                                
                                                <div style={{ marginBottom: '4px' }}>
                                                    <strong style={{ color: '#667eea', fontSize: '12px' }}>🚗 {t('transporterMap.speed')}:</strong>{' '}
                                                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: marker.speed > 0 ? '#10b981' : '#ef4444' }}>{marker.speed} km/h</span>
                                                    <span style={{ marginLeft: '4px', padding: '2px 5px', background: marker.speed > 0 ? '#d1fae5' : '#fee2e2', color: marker.speed > 0 ? '#065f46' : '#991b1b', borderRadius: '2px', fontSize: '10px' }}>
                                                        {marker.speed > 0 ? (t('transporterMap.moving') || 'Moving') : (t('transporterMap.stopped') || 'Stopped')}
                                                    </span>
                                                </div>
                                                
                                                {marker.attributes?.mileage !== undefined && marker.attributes?.mileage !== null && (
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <strong style={{ color: '#667eea', fontSize: '12px' }}>📏 {t('transporterMap.mileage') || 'Mileage'}:</strong>{' '}
                                                        <span style={{ fontSize: '12px', color: '#333' }}>{(marker.attributes.mileage / 1000).toFixed(2)} km</span>
                                                    </div>
                                                )}
                                                
                                                {marker.attributes?.temperature !== undefined && marker.attributes?.temperature !== null && (
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <strong style={{ color: '#667eea', fontSize: '12px' }}>🌡 {t('transporterMap.temperature') || 'Temperature'}:</strong>{' '}
                                                        <span style={{ fontSize: '12px', color: '#333' }}>{marker.attributes.temperature}°C</span>
                                                    </div>
                                                )}
                                                
                                                {marker.attributes?.hourmeter !== undefined && marker.attributes?.hourmeter !== null && (
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <strong style={{ color: '#667eea', fontSize: '12px' }}>⏲ {t('transporterMap.hourmeter') || 'Hourmeter'}:</strong>{' '}
                                                        <span style={{ fontSize: '12px', color: '#333' }}>{Math.floor(marker.attributes.hourmeter / 3600000)} hrs</span>
                                                    </div>
                                                )}
                                                
                                                {marker.attributes?.ignition !== undefined && marker.attributes?.ignition !== null && (
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <strong style={{ color: '#667eea', fontSize: '12px' }}>🔑 {t('transporterMap.accStatus') || 'Ignition'}:</strong>{' '}
                                                        <span style={{ color: marker.attributes.ignition ? '#10b981' : '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>
                                                            {marker.attributes.ignition ? (t('transporterMap.accOn') || 'ON') : (t('transporterMap.accOff') || 'OFF')}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {marker.attributes?.satellites !== undefined && marker.attributes?.satellites !== null && (
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <strong style={{ color: '#667eea', fontSize: '12px' }}>🛰 {t('transporterMap.satellites') || 'Satellites'}:</strong>{' '}
                                                        <span style={{ fontSize: '12px', color: '#333' }}>{marker.attributes.satellites}</span>
                                                    </div>
                                                )}
                                                
                                                {marker.altitude !== undefined && marker.altitude !== null && (
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <strong style={{ color: '#667eea', fontSize: '12px' }}>⛰ {t('transporterMap.altitude') || 'Altitude'}:</strong>{' '}
                                                        <span style={{ fontSize: '12px', color: '#333' }}>{marker.altitude} m</span>
                                                    </div>
                                                )}
                                                
                                                {marker.address && (
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <strong style={{ color: '#667eea', fontSize: '12px' }}>📍 {t('transporterMap.address') || 'Address'}:</strong><br/>
                                                        <span style={{ fontSize: '11px', color: '#555' }}>{marker.address}</span>
                                                    </div>
                                                )}
                                                
                                                {!marker.address && (marker.city || marker.state || marker.country) && (
                                                    <div style={{ marginBottom: '4px' }}>
                                                        <strong style={{ color: '#667eea', fontSize: '12px' }}>📍 {t('transporterMap.location') || 'Location'}:</strong><br/>
                                                        <span style={{ fontSize: '11px', color: '#555' }}>{[marker.city, marker.state, marker.country].filter(Boolean).join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e5e7eb' }}>
                                                <a href={getWhatsAppShareUrl(marker.lat, marker.lng, marker.name)} target="_blank" rel="noopener noreferrer" 
                                                   title={t('transporterMap.shareWhatsApp') || 'Share on WhatsApp'}
                                                   style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#25D366', color: 'white', textDecoration: 'none', width: '28px', height: '28px', borderRadius: '4px' }}>
                                                    <svg style={{ width: '16px', height: '16px', fill: 'white' }} viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                                </a>
                                                <a href={getStreetViewUrl(marker.lat, marker.lng)} target="_blank" rel="noopener noreferrer" 
                                                   title={t('transporterMap.streetView') || 'Street View'}
                                                   style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#4285f4', color: 'white', textDecoration: 'none', width: '28px', height: '28px', borderRadius: '4px' }}>
                                                    <svg style={{ width: '16px', height: '16px', fill: 'white' }} viewBox="0 0 24 24"><path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z"/></svg>
                                                </a>
                                            </div>
                                        </div>
                                    </InfoWindow>
                                )}
                            </GoogleMarker>
                        ))
                    }
                </MarkerClusterer>
                {showGeofence && geofences.map((geofence, index) => (
                    <GeofencePolygon key={index} geofence={geofence} />
                ))}
                {enableScale && <GoogleScaleControl mapRef={mapRef} position="BOTTOM_LEFT" />}
                {enableFullscreen && <GoogleFullscreenControl mapRef={mapRef} position="TOP_LEFT" />}
                {enableMeasurement && <GoogleMeasurementTool mapRef={mapRef} position="TOP_LEFT" unit="metric" enabled={true} />}
            </GoogleMap>
        </LoadScript>
    );
};

GoogleClusteredMap.propTypes = {
    mapKey: PropTypes.string,
    markers: PropTypes.array.isRequired,
    selectedMarker: PropTypes.string,
    geofences: PropTypes.array,
    showGeofence: PropTypes.bool,
    handleSelected: PropTypes.func,
    enableScale: PropTypes.bool,
    enableFullscreen: PropTypes.bool,
    enableMeasurement: PropTypes.bool
};

export default GoogleClusteredMap;