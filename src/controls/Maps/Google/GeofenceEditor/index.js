import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from "prop-types";
import { v4 as uuidv4 } from "uuid";
import { GoogleMap, LoadScript, DrawingManager, Polygon } from '@react-google-maps/api';
import UserLocation from "controls/Maps/UserLocation";
import { closePolygon } from 'controls/Maps/utils/coordinateUtils';

const libraries = ['drawing'];

const GoogleGeofenceEditor = ({ 
  mapKey,
  initialPolygons = [],
  selectedPolygon,
  handleSelected,
  setOpen,
  setIsEditing, 
  addRef, 
  saveRef, 
  cancelRef, 
  editingRef, 
  removeRef }) => {
  const polygons = useRef(initialPolygons);
  const [userLocation, setUserLocation] = useState({ lat: 4.624335, lng: -74.063644 });
  const [drawingMode, setDrawingMode] = useState(null);
  const mapRef = useRef(null);
  const polygonRef = useRef(null);
  const drawingManagerRef = useRef(null);
  const editedPolygonRef = useRef(null);
  const editedPolygonIdRef = useRef(null);
  const editedCoordinatesRef = useRef(null);

  useEffect(() => {
    const formattedPolygons = initialPolygons.map(polygon => ({
      ...polygon,
      latlngs: polygon.latlngs.map(([lat, lng]) => ({ lat, lng }))
    }));
    polygons.current = formattedPolygons;
  }, [initialPolygons]);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const onDrawingManagerLoad = useCallback((drawingManager) => {
    drawingManagerRef.current = drawingManager;
  }, []);

  const handlePolygonComplete = (polygon) => {
    const path = polygon.getPath().getArray().map(latlng => ({
      lat: latlng.lat(),
      lng: latlng.lng()
    }));
    const newPolygonData = {
      id: uuidv4(),
      name: `Polygon ${polygons.current.length + 1}`,
      latlngs: path,
    };

    polygons.current = [...polygons.current, newPolygonData];
    polygonRef.current = newPolygonData;
    setOpen(true);
    setDrawingMode(null);
    polygon.setMap(null);
  };

  const save = () => {
    if (polygonRef.current) {
      const latlngs = closePolygon(polygonRef.current.latlngs);
      const id = polygonRef.current.id;
      polygonRef.current = null;
      setOpen(false);
      return { id, latlngs };
    }
  };

  const cancel = () => {
    polygonRef.current = null;
  };

  const handlePolygonEdit = (id, polygonInstance) => {
    const newPath = polygonInstance.getPath().getArray().map(latlng => ({
      lat: latlng.lat(),
      lng: latlng.lng()
    }));
    editedCoordinatesRef.current = closePolygon(newPath);
    const polygon = polygons.current.find((polygon) => polygon.id === id);
    handleSelected(polygon.name);
    setIsEditing(true);
    editedPolygonIdRef.current = id; 
    editedPolygonRef.current = polygonInstance;

  };

  const handlePolygonDelete = (id) => {
    const updatedPolygons = polygons.current.filter(polygon => polygon.id !== id);
    polygons.current = updatedPolygons;
  };

  const endEditing = () => {
    const polygon = polygons.current.find((polygon) => polygon.id == editedPolygonIdRef.current);
    if (polygon) {
      polygon.latlngs = editedCoordinatesRef.current;
    }
    editedCoordinatesRef.current = null;
    editedPolygonIdRef.current = null;
    editedPolygonRef.current = null;
    handleSelected(null);
    return polygon;
  };

  const add = () => {
    setDrawingMode('polygon');
    polygonRef.current = null;
    editedPolygonIdRef.current = null; 
    editedPolygonRef.current = null;
    setIsEditing(false);
    handleSelected(null);
    setIsEditing(true);
  };

  useEffect(() => {
    if (addRef) { addRef.current = add; }
    if (saveRef) { saveRef.current = save; }
    if (cancelRef) { cancelRef.current = cancel; }
    if (editingRef) { editingRef.current = endEditing; }
    if (removeRef) { removeRef.current = handlePolygonDelete; }
  }, [addRef, saveRef, cancelRef, removeRef, editingRef, endEditing]);

  return (
    <LoadScript googleMapsApiKey={mapKey} libraries={libraries}>
      <UserLocation setUserLocation={setUserLocation} />
      <GoogleMap
        onLoad={onLoad}
        mapContainerStyle={{ height: "70vh", width: "100%" }}
        center={userLocation}
        zoom={6}
        options={{ gestureHandling: 'greedy' }}
      >
        {window.google && window.google.maps && (
          <DrawingManager
            onLoad={onDrawingManagerLoad}
            onPolygonComplete={handlePolygonComplete}
            options={{
              drawingControl: false,
              drawingMode: drawingMode,
              polygonOptions: {
                editable: true,
                draggable: true
              }
            }}
          />        
        )}
        {polygons.current.map((polygon, index) => (
          <Polygon
            key={polygon.id}
            path={polygon.latlngs}
            options={{
              editable: polygon.name === selectedPolygon,
              draggable: polygon.name === selectedPolygon,
            }}
            onLoad={polygonInstance => {
              polygonInstance.addListener('mouseup', () => handlePolygonEdit(polygon.id, polygonInstance));
            }}
          />
        ))}
      </GoogleMap>
    </LoadScript>
  );
};

GoogleGeofenceEditor.propTypes = {
  mapKey: PropTypes.string,
  initialPolygons: PropTypes.array,
  selectedPolygon: PropTypes.string,
  handleSelected: PropTypes.func,
  setOpen: PropTypes.func,
  setIsEditing: PropTypes.func,
  addRef: PropTypes.object,
  saveRef: PropTypes.object,
  cancelRef: PropTypes.object,
  editingRef: PropTypes.object,
  removeRef: PropTypes.object,
};

export default GoogleGeofenceEditor;