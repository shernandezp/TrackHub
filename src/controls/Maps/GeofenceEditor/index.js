import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-editable";
import { v4 as uuidv4 } from "uuid";
import PropTypes from "prop-types";

const GeofenceEditor = ({ initialPolygons }) => {
  const mapRef = useRef(null);
  const [geofences, setGeofences] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedGeofences, setEditedGeofences] = useState(new Set());

  useEffect(() => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    if (map) {
      map.editTools = new L.Editable(map);

      map.on("editable:drawing:commit", (e) => {
        const { layer } = e;
        const latlngs = layer.getLatLngs()[0];
        console.log("Polygon coordinates:", latlngs);
        const name = prompt("Enter a name for the geofence:");
        if (name) {
          const id = uuidv4();
          setGeofences((prev) => [...prev, { id, name, latlngs, layer }]);
          map.editTools.stopDrawing();
        } else {
          map.removeLayer(layer);
        }
        setIsEditing(false);
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

  const toggleEditing = () => {
    const map = mapRef.current;
    if (isEditing) {
      map.editTools.stopDrawing();
    } else {
      map.editTools.startPolygon();
    }
    setIsEditing(!isEditing);
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
    setIsEditing(false);
  };

  return (
    <div>
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: "100vh", width: "100%" }}
        ref={mapRef}
        doubleClickZoom={false}
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {geofences.map((geofence) => (
          <Polygon
            key={geofence.id}
            positions={geofence.latlngs}
            eventHandlers={{
              click: () => handlePolygonClick(geofence.id),
            }}
          />
        ))}
      </MapContainer>
      <button
        onClick={toggleEditing}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
        }}
      >
        {isEditing ? "Stop Editing" : "Start Editing"}
      </button>
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
};

export default GeofenceEditor;