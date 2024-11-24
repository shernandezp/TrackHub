import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-editable";
import { v4 as uuidv4 } from "uuid";
import PropTypes from "prop-types";

const GeofenceEditor = ({ initialPolygons, setOpen, setIsEditing, addRef, saveRef, cancelRef, editingRef, removeRef }) => {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const editedGeofenceRef = useRef(null);
  const [geofences, setGeofences] = useState([]);

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
    if (initialPolygons && initialPolygons.length > 0 && geofences.length === 0) {
      if (mapRef.current) {
        initialPolygons.forEach((polygon) => {
          const id = polygon.id;
          const newPolygon = L.polygon(polygon.latlngs).addTo(mapRef.current);
          setGeofences((prev) => [...prev, { id, ...polygon, layer: newPolygon }]);
        });
      }
    }
  }, [initialPolygons, geofences.length]);

  const handlePolygonClick = (id) => {
    const polygonLayer = geofences.find((geofence) => geofence.id === id)?.layer;
    if (polygonLayer) {
      if (polygonLayer.editEnabled()) {
        polygonLayer.disableEdit();
        setIsEditing(false);
        editedGeofenceRef.current = null;
      } else {
        disableEditing();
        setIsEditing(true);
        polygonLayer.enableEdit();
        editedGeofenceRef.current = id;
      }
    }
  };

  const disableEditing = () => {
    if (editedGeofenceRef.current) {
      const prevLayer = geofences.find((geofence) => geofence.id === editedGeofenceRef.current)?.layer;
      prevLayer.disableEdit();
      editedGeofenceRef.current = null;
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

  const save = () => {
    const map = mapRef.current;
    const latlngs = layerRef.current.getLatLngs()[0];
    // Ensure the polygon is closed
    if (latlngs.length > 0 && !latlngs[0].equals(latlngs[latlngs.length - 1])) {
      latlngs.push(latlngs[0]);
    }
    const id = uuidv4();
    setGeofences((prev) => [...prev, { id, latlngs, layer: layerRef.current } ]);
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
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: "70vh", width: "100%" }}
        ref={mapRef}
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

GeofenceEditor.propTypes = {
  initialPolygons: PropTypes.array,
  setOpen: PropTypes.func,
  setIsEditing: PropTypes.func,
  addRef: PropTypes.object,
  saveRef: PropTypes.object,
  cancelRef: PropTypes.object,
  editingRef: PropTypes.object,
  removeRef: PropTypes.object,
};

export default GeofenceEditor;