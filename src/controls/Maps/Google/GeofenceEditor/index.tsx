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

import { MAP_DEFAULTS } from 'api/core/endpoints';
import { useState, useCallback, useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import { v4 as uuidv4 } from "uuid";
import { GoogleMap, LoadScript, DrawingManager, Polygon } from '@react-google-maps/api';
import type { Libraries } from '@react-google-maps/api';
import UserLocation from "controls/Maps/UserLocation";
import { closePolygon } from 'controls/Maps/utils/coordinateUtils';
import { GoogleScaleControl } from 'controls/Maps/shared/ScaleControl';
import { GoogleFullscreenControl } from 'controls/Maps/shared/FullscreenControl';
import { GoogleMeasurementTool } from 'controls/Maps/shared/MeasurementTool';
import type {
  MapPoint,
  MapPolygon,
  GeofenceShapeHandle,
  AddGeofenceHandler,
  SaveGeofenceHandler,
  CancelGeofenceHandler,
  EditGeofenceHandler,
  RemoveGeofenceHandler
} from 'layouts/geofencemanager/components/GeofenceEditor';

const libraries: Libraries = ['drawing'];

/** A polygon held in the editor's mutable ref (drawn coords as `{ lat, lng }`). */
interface EditorPolygon {
  id: string;
  name: string;
  latlngs: MapPoint[];
}

interface GoogleGeofenceEditorProps {
  mapKey?: string;
  initialPolygons?: MapPolygon[];
  selectedPolygon?: string | null;
  handleSelected: (value: string | null) => void;
  setOpen: (open: boolean) => void;
  setIsEditing: (editing: boolean) => void;
  addRef?: RefObject<AddGeofenceHandler | null>;
  saveRef?: RefObject<SaveGeofenceHandler | null>;
  cancelRef?: RefObject<CancelGeofenceHandler | null>;
  editingRef?: RefObject<EditGeofenceHandler | null>;
  removeRef?: RefObject<RemoveGeofenceHandler | null>;
  enableScale?: boolean;
  enableFullscreen?: boolean;
  enableMeasurement?: boolean;
  height?: string;
}

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
  removeRef,
  enableScale = true,
  enableFullscreen = true,
  enableMeasurement = true,
  height = '70vh'
}: GoogleGeofenceEditorProps) => {
  // Reformatted to `{ lat, lng }` coords by the effect below before first use.
  const polygons = useRef<EditorPolygon[]>(initialPolygons as unknown as EditorPolygon[]);
  const [userLocation, setUserLocation] = useState({
    lat: MAP_DEFAULTS.lat,
    lng: MAP_DEFAULTS.lng
  });
  const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polygonRef = useRef<EditorPolygon | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const editedPolygonRef = useRef<google.maps.Polygon | null>(null);
  const editedPolygonIdRef = useRef<string | null>(null);
  const editedCoordinatesRef = useRef<MapPoint[] | null>(null);

  useEffect(() => {
    const formattedPolygons: EditorPolygon[] = initialPolygons.map(polygon => ({
      ...polygon,
      latlngs: polygon.latlngs.map(([lat, lng]) => ({ lat, lng }))
    }));
    polygons.current = formattedPolygons;
  }, [initialPolygons]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onDrawingManagerLoad = useCallback((drawingManager: google.maps.drawing.DrawingManager) => {
    drawingManagerRef.current = drawingManager;
  }, []);

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath().getArray().map(latlng => ({
      lat: latlng.lat(),
      lng: latlng.lng()
    }));
    const newPolygonData: EditorPolygon = {
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

  const save = (): GeofenceShapeHandle | undefined => {
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

  const handlePolygonEdit = (id: string, polygonInstance: google.maps.Polygon) => {
    const newPath = polygonInstance.getPath().getArray().map(latlng => ({
      lat: latlng.lat(),
      lng: latlng.lng()
    }));
    editedCoordinatesRef.current = closePolygon(newPath);
    const polygon = polygons.current.find((polygon) => polygon.id === id);
    handleSelected(polygon!.name);
    setIsEditing(true);
    editedPolygonIdRef.current = id;
    editedPolygonRef.current = polygonInstance;

  };

  const handlePolygonDelete = (id: string) => {
    const updatedPolygons = polygons.current.filter(polygon => polygon.id !== id);
    polygons.current = updatedPolygons;
  };

  const endEditing = (): GeofenceShapeHandle | undefined => {
    const polygon = polygons.current.find((polygon) => polygon.id == editedPolygonIdRef.current);
    if (polygon) {
      polygon.latlngs = editedCoordinatesRef.current!;
    }
    editedCoordinatesRef.current = null;
    editedPolygonIdRef.current = null;
    editedPolygonRef.current = null;
    handleSelected(null);
    return polygon;
  };

  const add = () => {
    setDrawingMode('polygon' as google.maps.drawing.OverlayType);
    polygonRef.current = null;
    editedPolygonIdRef.current = null;
    editedPolygonRef.current = null;
    setIsEditing(false);
    handleSelected(null);
    setIsEditing(true);
  };

  useEffect(() => {
    if (addRef) { addRef.current = add; }
    if (saveRef) { saveRef.current = save as SaveGeofenceHandler; }
    if (cancelRef) { cancelRef.current = cancel; }
    if (editingRef) { editingRef.current = endEditing as EditGeofenceHandler; }
    if (removeRef) { removeRef.current = handlePolygonDelete; }
  }, [addRef, saveRef, cancelRef, removeRef, editingRef, endEditing]);

  return (
    <LoadScript googleMapsApiKey={mapKey ?? ''} libraries={libraries}>
      <UserLocation setUserLocation={setUserLocation} />
      <GoogleMap
        onLoad={onLoad}
        mapContainerStyle={{ height: height, width: "100%" }}
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
        {polygons.current.map((polygon) => (
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
        {enableScale && <GoogleScaleControl mapRef={mapRef} position="BOTTOM_LEFT" />}
        {enableFullscreen && <GoogleFullscreenControl mapRef={mapRef} position="TOP_LEFT" />}
        {enableMeasurement && <GoogleMeasurementTool mapRef={mapRef} position="TOP_LEFT" unit="metric" enabled={true} />}
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleGeofenceEditor;
