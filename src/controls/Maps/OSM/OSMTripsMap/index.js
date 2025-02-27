import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import UserLocation from "controls/Maps/UserLocation";
import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';
import startIconUrl from 'assets/images/markers/start_marker.svg';
import endIconUrl from 'assets/images/markers/end_marker.svg';
import singleIconUrl from 'assets/images/markers/single_marker.svg';

const startIcon = new L.Icon({ iconUrl: startIconUrl, iconSize: [20, 20] });
const endIcon = new L.Icon({ iconUrl: endIconUrl, iconSize: [20, 20] });

const OSMTripsMap = ({ trips = [], selectedTrip, handleSelected }) => {
  const mapRef = useRef();
  const [userLocation, setUserLocation] = useState({
    lat: parseFloat(process.env.REACT_APP_DEFAULT_LAT),
    lng: parseFloat(process.env.REACT_APP_DEFAULT_LNG)
  });

  const handleClick = (tripId) => {
    if (selectedTrip !== tripId) {
      handleSelected(tripId);
    }
  };

  const getPolylineStyle = (tripId, currentcolor) => {
    return {
      color: tripId === selectedTrip ? 'red' : currentcolor,
      weight: tripId === selectedTrip ? 6 : 4,
    };
  };

  const getMarkerStyle = (tripId) => {
    let size = tripId === selectedTrip ? 30 : 20;
    return new L.Icon({ iconUrl: singleIconUrl, iconSize: [size, size] });
  };

  // Helper function to calculate the bounding box of an array of coordinates
  const calculateBoundingBox = (coordinates) => {
    const latitudes = coordinates.map(coord => coord[0]);
    const longitudes = coordinates.map(coord => coord[1]);
    const southWest = [Math.min(...latitudes), Math.min(...longitudes)];
    const northEast = [Math.max(...latitudes), Math.max(...longitudes)];
    return [southWest, northEast];
  };

  // Function to calculate the bounding box of all trips
  const calculateBounds = () => {
    if (trips.length === 0) {
      return [[4.624335, -74.063644], [4.624335, -74.063644]];
    }
    const allCoords = trips.flatMap(trip => trip.coordinates);
    return calculateBoundingBox(allCoords);
  };

  // Function to calculate the bounding box of a specific trip
  const calculateTripBounds = (trip) => {
    return calculateBoundingBox(trip.coordinates);
  };

  // Center in selected polygon
  useEffect(() => {
    if (mapRef.current && selectedTrip) {
      const map = mapRef.current;
      const selectedTripData = trips.find(trip => trip.id === selectedTrip);
      if (selectedTripData) {
        const bounds = calculateTripBounds(selectedTripData);
        map.fitBounds(bounds);
      }
    }
  }, [selectedTrip, trips]);

  // Center the map to the bounding box of all trips
  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      const bounds = calculateBounds();
      map.fitBounds(bounds);
    }
  }, [trips]);

  return (
    <div>
      <UserLocation setUserLocation={setUserLocation} />
      <MapContainer ref={mapRef} center={userLocation} zoom={13} style={{ height: '70vh', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {trips.map((trip, index) => {
          return (
            <React.Fragment key={index}>
              {trip.coordinates.length === 1 
                ? (<Marker 
                    position={trip.coordinates[0]} 
                    icon={getMarkerStyle(trip.id)}
                    eventHandlers={{ click: () => {
                      handleClick(trip.id);
                      mapRef.current.setView(trip.coordinates[0], 13);
                    }}}/>) 
                : (
                  <>
                    <Polyline
                      key={trip.id}
                      positions={trip.coordinates}
                      pathOptions={getPolylineStyle(trip.id, trip.color)}
                      eventHandlers={{ click: () => handleClick(trip.id) }}
                    />
                    {trip.coordinates.length > 1 && (
                      <>
                        <Marker position={trip.coordinates[0]} icon={startIcon}/>
                        <Marker position={trip.coordinates[trip.coordinates.length - 1]} icon={endIcon}/>
                      </>
                    )}
                  </>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

OSMTripsMap.propTypes = {
  selectedTrip: PropTypes.string,
  handleSelected: PropTypes.func.isRequired,
  trips: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)).isRequired,
    })
  ),
};

export default OSMTripsMap;