import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-editable";
import { v4 as uuidv4 } from "uuid";
import PropTypes from "prop-types";

const GeofenceEditor = ({ initialPolygons, setOpen, addRef, saveRef, cancelRef }) => {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [geofences, setGeofences] = useState([]);
  const [editedGeofences, setEditedGeofences] = useState(new Set());

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
          const id = uuidv4();
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
      } else {
        polygonLayer.enableEdit();
        setEditedGeofences((prev) => new Set(prev).add(id));
      }
    }
  };

  const endEditing = () => {
    const map = mapRef.current;

    if (!map) return;

    editedGeofences.forEach((id) => {
      const geofence = geofences.find((geofence) => geofence.id === id);
      if (geofence) {
        const polygonLayer = geofence.layer;
        if (polygonLayer) {
          const coordinates = polygonLayer.getLatLngs()[0];
          console.log(`Edited polygon coordinates for geofence ${geofence.id}:`, coordinates);

          polygonLayer.disableEdit();
          polygonLayer.setLatLngs([coordinates]);

          geofence.latlngs = coordinates;
        }
      }
    });

    map.editTools.stopDrawing();
    setEditedGeofences(new Set());
  };

  const add = () => {
    const map = mapRef.current;
    map.editTools.startPolygon();
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

  useEffect(() => {
    if (addRef) {
      addRef.current = add;
    }
    if (saveRef) {
      saveRef.current = save;
    }
    if (cancelRef) {
      cancelRef.current = cancel;
    }
  }, [addRef, saveRef, cancelRef]);

  return (
    <div>
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
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
      <button
        onClick={endEditing}
        style={{
          position: "absolute",
          top: "50px",
          right: "10px",
          zIndex: 1000,
        }}
      >
        End Editing
      </button>
    </div>
  );
};

GeofenceEditor.propTypes = {
  initialPolygons: PropTypes.array,
  setOpen: PropTypes.func,
  addRef: PropTypes.object,
  saveRef: PropTypes.object,
  cancelRef: PropTypes.object,
};

export default GeofenceEditor;