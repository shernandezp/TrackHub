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

import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import UserLocation from "controls/Maps/UserLocation";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-editable";
import { v4 as uuidv4 } from "uuid";
import PropTypes from "prop-types";

const OSMGeofenceEditor = ({ 
    initialPolygons,
    selectedPolygon,
    handleSelected,
    setOpen,
    setIsEditing, 
    addRef, 
    saveRef, 
    cancelRef, 
    editingRef, 
    removeRef }) => {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const editedGeofenceRef = useRef(null);
  const [geofences, setGeofences] = useState([]);
  const [userLocation, setUserLocation] = useState({ lat: 4.624335, lng: -74.063644 });

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    if (map) {
      map.editTools = new L.Editable(map);

      map.on("editable:drawing:commit", (e) => {
        const { layer } = e;
        layerRef.current = layer;
        setOpen(true);
      });
    }
    return () => {
      if (map) {
        map.off("editable:drawing:commit");
      }
    };
  }, [mapRef.current]);

  useEffect(() => {
    if (!selectedPolygon) return;
    const geofence = geofences.find((geofence) => geofence.name === selectedPolygon);
    selectPolygon(geofence.id);
  }, [selectedPolygon]);

  useEffect(() => {
    if (initialPolygons && initialPolygons.length > 0 && geofences.length === 0) {
      if (mapRef.current) {
        initialPolygons.forEach((polygon) => {
          const id = polygon.id;
          const name = polygon.name;
          const newPolygon = L.polygon(polygon.latlngs).addTo(mapRef.current);
          setGeofences((prev) => [...prev, { id, name, ...polygon, layer: newPolygon }]);
        });
      }
    }
  }, [initialPolygons, geofences.length]);

  const handlePolygonClick = (id) => {
    selectPolygon(id);
  };

  const selectPolygon = (id) => {
    const geofence = geofences.find((geofence) => geofence.id === id);
    if (geofence) {
      const polygonLayer = geofence.layer;
      if (polygonLayer.editEnabled()) {
        setIsEditing(false);
        polygonLayer.disableEdit();
        editedGeofenceRef.current = null;
      } else {
        disableEditing();
        setIsEditing(true);
        polygonLayer.enableEdit();
        editedGeofenceRef.current = id;
        handleSelected(geofence.name);
      }
    }
  };

  const disableEditing = () => {
    if (editedGeofenceRef.current) {
      const geofence = geofences.find((geofence) => geofence.id === editedGeofenceRef.current);
      if (geofence){
        const prevLayer = geofence.layer;
        prevLayer.disableEdit();
        editedGeofenceRef.current = null;
      }
    }
  };

  const endEditing = () => {
    const map = mapRef.current;

    if (!map) return;
    const geofence = geofences.find((geofence) => geofence.id == editedGeofenceRef.current);
    if (geofence) {
      const polygonLayer = geofence.layer;
      if (polygonLayer) {
        const coordinates = polygonLayer.getLatLngs()[0];
        polygonLayer.disableEdit();
        polygonLayer.setLatLngs([coordinates]);
        if (coordinates.length > 0 && !coordinates[0].equals(coordinates[coordinates.length - 1])) {
          coordinates.push(coordinates[0]);
        }
        geofence.latlngs = coordinates;
        setIsEditing(false);
      }
    }

    map.editTools.stopDrawing();
    editedGeofenceRef.current = null;
    return geofence;
  };

  const add = () => {
    const map = mapRef.current;
    map.editTools.startPolygon();
    disableEditing();
    setIsEditing(false);
  };

  const save = (name) => {
    const map = mapRef.current;
    const latlngs = layerRef.current.getLatLngs()[0];
    // Ensure the polygon is closed
    if (latlngs.length > 0 && !latlngs[0].equals(latlngs[latlngs.length - 1])) {
      latlngs.push(latlngs[0]);
    }
    const id = uuidv4();
    setGeofences((prev) => [...prev, { id, name, latlngs, layer: layerRef.current } ]);
    map.editTools.stopDrawing();
    layerRef.current.disableEdit();
    setOpen(false);
    layerRef.current = null;
    return { id, latlngs };
  };

  const cancel = () => {
    const map = mapRef.current;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    layerRef.current = null;
  };

  const remove = (id) => {
    const map = mapRef.current;
    const geofence = geofences.find((geofence) => geofence.id === id);
    if (geofence) {
      map.removeLayer(geofence.layer);
      setGeofences((prev) => prev.filter((geofence) => geofence.id !== id));
    }
  };

  useEffect(() => {
    if (addRef) { addRef.current = add; }
    if (saveRef) { saveRef.current = save; }
    if (cancelRef) { cancelRef.current = cancel; }
    if (editingRef) { editingRef.current = endEditing; }
    if (removeRef) { removeRef.current = remove; }
  }, [addRef, saveRef, cancelRef, editingRef, endEditing]);

  return (
    <div>
      <UserLocation setUserLocation={setUserLocation} />
      <MapContainer
        center={userLocation}
        zoom={7}
        style={{ height: "70vh", width: "100%" }}
        ref={mapRef}
        doubleClickZoom={false}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {geofences.map((geofence) => (
          <Polygon
            key={geofence.id}
            positions={geofence.latlngs}
            eventHandlers={{ click: () => handlePolygonClick(geofence.id) }}
          />
        ))}
      </MapContainer>
    </div>
  );
};

OSMGeofenceEditor.propTypes = {
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

export default OSMGeofenceEditor;