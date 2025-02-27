import React, { useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import UserLocation from "controls/Maps/UserLocation";
import { GoogleMap, LoadScript, Polyline, Marker } from '@react-google-maps/api';

const GoogleTripsMap = ({ mapKey = [], trips, selectedTrip, handleSelected }) => {
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
        mapContainerStyle={{ height: "70vh", width: "100%" }}
        zoom={6}
        center={userLocation}
        onLoad={map => (mapRef.current = map)}
      >
        {trips.map((trip, index) => (
          trip.coordinates.length === 1 ? (
            <Marker
              key={index}
              position={{ lat: trip.coordinates[0][0], lng: trip.coordinates[0][1] }}
              icon={getIcon('single', trip.id)}
              onClick={() => handleClick(trip)}
            />
          ) : (
            <React.Fragment key={index}>
                <Polyline
                    key={index}
                    path={trip.coordinates.map(coord => ({ lat: coord[0], lng: coord[1] }))}
                    options={getPolylineOptions(trip)}
                    onClick={() => handleClick(trip)}/>
                <Marker
                    position={{ lat: trip.coordinates[0][0], lng: trip.coordinates[0][1] }}
                    icon={getIcon('start', trip.id)}/>
                <Marker
                    position={{ lat: trip.coordinates[trip.coordinates.length - 1][0], lng: trip.coordinates[trip.coordinates.length - 1][1] }}
                    icon={getIcon('end', trip.id)}/>
            </React.Fragment>
          )
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

GoogleTripsMap.propTypes = {
    mapKey: PropTypes.string,
    selectedTrip: PropTypes.string,
    handleSelected: PropTypes.func.isRequired,
    trips: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
      })
    ),
  };

export default GoogleTripsMap;