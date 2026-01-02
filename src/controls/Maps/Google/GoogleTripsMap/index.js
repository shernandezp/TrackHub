import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import UserLocation from "controls/Maps/UserLocation";
import GeofencePolygon from 'controls/Maps/Google/GeofencePolygon';
import { GoogleMap, LoadScript, Polyline, Marker } from '@react-google-maps/api';
import { GoogleScaleControl } from 'controls/Maps/shared/ScaleControl';
import { GoogleFullscreenControl } from 'controls/Maps/shared/FullscreenControl';
import { GoogleMeasurementTool } from 'controls/Maps/shared/MeasurementTool';
import { GoogleStatsToggle } from 'controls/Maps/shared/StatsToggle';

const GoogleTripsMap = ({ 
  mapKey = [], 
  trips, 
  selectedTrip, 
  showGeofence,
  geofences,
  handleSelected,
  toggleStats,
  showStats,
  enableScale = true,
  enableFullscreen = true,
  enableMeasurement = true,
  height = "70vh"
}) => {
  const mapRef = useRef(null);
  const [userLocation, setUserLocation] = useState({
    lat: parseFloat(process.env.REACT_APP_DEFAULT_LAT),
    lng: parseFloat(process.env.REACT_APP_DEFAULT_LNG)
  });

  const handleClick = (trip) => {
    if (selectedTrip !== trip.id) {
      handleSelected(trip.id);
    }
  };

  const getPolylineOptions = (trip) => {
    return {
      strokeColor: selectedTrip === trip.id ? 'red' : trip.color,
      strokeOpacity: 1,
      strokeWeight: selectedTrip === trip.id ? 6 : 4
    };
  };
  
    // Center in selected polyline
  useEffect(() => {
    if (mapRef.current && selectedTrip) {
      const selectedTripData = trips.find(trip => trip.id === selectedTrip);
      if (selectedTripData) {
        const bounds = new window.google.maps.LatLngBounds();
        selectedTripData.coordinates.forEach(coord => {
            bounds.extend(new window.google.maps.LatLng(coord[0], coord[1]));
        });
        mapRef.current.fitBounds(bounds);
      }
    }
  }, [selectedTrip, trips]);

  // center the map on the bounds of the trips
  useEffect(() => {
    if (mapRef.current && trips.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      trips.forEach(trip => {
        trip.coordinates.forEach(coord => {
          bounds.extend(new window.google.maps.LatLng(coord[0], coord[1]));
        });
      });
      mapRef.current.fitBounds(bounds);
    }
  }, [trips]);

  const getIcon = (type, tripId) => {
    let url = '';
    let size = tripId === selectedTrip ? 30 : 20;
    switch (type) {
        case 'start': url = 'assets/images/markers/start_marker.svg'; break;
        case 'end': url = 'assets/images/markers/end_marker.svg'; break;
        case 'single': url = 'assets/images/markers/single_marker.svg'; break;
        default:
          break;
      }
    return {
        url: url,
        scaledSize: new window.google.maps.Size(size, size)
    };
  };

  return (
    <LoadScript googleMapsApiKey={mapKey}>
      <UserLocation setUserLocation={setUserLocation} />
      <GoogleMap
        mapContainerStyle={{ height: height, width: "100%" }}
        zoom={6}
        center={userLocation}
        onLoad={map => (mapRef.current = map)}
        options={{ gestureHandling: "greedy" }}>
        {trips.map((trip, index) => (
          trip.type === 1 ? (
            <Marker
              key={index}
              position={{ lat: trip.coordinates[0][0], lng: trip.coordinates[0][1] }}
              icon={getIcon('single', trip.id)}
              onClick={() => handleClick(trip)}
            />
          ) : (
            <Polyline
              key={index}
              path={trip.coordinates.map(coord => ({ lat: coord[0], lng: coord[1] }))}
              options={getPolylineOptions(trip)}
              onClick={() => handleClick(trip)}/>
          )
        ))}
        {trips.length > 0 && trips.some(trip => trip.coordinates.length > 1) && (
          <>
            <Marker
              position={{ lat: trips.find(trip => trip.coordinates.length > 1).coordinates[0][0], lng: trips.find(trip => trip.coordinates.length > 1).coordinates[0][1] }}
              icon={getIcon('start')}/>
            <Marker
              position={{ lat: trips[trips.length - 1].coordinates[trips[trips.length - 1].coordinates.length - 1][0], lng: trips[trips.length - 1].coordinates[trips[trips.length - 1].coordinates.length - 1][1] }}
              icon={getIcon('end')}/>
          </>
        )}
        {showGeofence && geofences.map((geofence, index) => (
          <GeofencePolygon key={index} geofence={geofence} />
        ))}
        {enableScale && <GoogleScaleControl mapRef={mapRef} position="BOTTOM_LEFT" />}
        {enableFullscreen && <GoogleFullscreenControl mapRef={mapRef} position="TOP_LEFT" />}
        {enableMeasurement && <GoogleMeasurementTool mapRef={mapRef} position="TOP_LEFT" unit="metric" enabled={true} />}
        <GoogleStatsToggle position="TOP_LEFT" toggleStats={toggleStats} showStats={showStats} />
      </GoogleMap>
    </LoadScript>
  );
};

GoogleTripsMap.propTypes = {
    mapKey: PropTypes.string,
    selectedTrip: PropTypes.string,
    handleSelected: PropTypes.func.isRequired,
    showGeofence: PropTypes.bool,
    geofences: PropTypes.array,
    trips: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
      })
    ),
    enableScale: PropTypes.bool,
    enableFullscreen: PropTypes.bool,
    enableMeasurement: PropTypes.bool,
    toggleStats: PropTypes.func,
    showStats: PropTypes.bool,
    height: PropTypes.string
  };

export default GoogleTripsMap;