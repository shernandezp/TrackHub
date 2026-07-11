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

import { useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import OSMGeofenceEditorBase from 'controls/Maps/OSM/GeofenceEditor';
import GoogleGeofenceEditorBase from 'controls/Maps/Google/GeofenceEditor';
import MapControlStyle from 'controls/Maps/styles/MapControl';

/** A point in the imperative map-editor handle payloads. */
export interface MapPoint { lat: number; lng: number; }
/** Result of committing (save/edit) a drawn geofence shape on the map. */
export interface GeofenceShapeHandle { id: string; latlngs: MapPoint[]; }
/** A polygon rendered on the map (geom coordinates as [lat, lng] tuples). */
export interface MapPolygon { id: string; name: string; latlngs: [number, number][]; }

export type AddGeofenceHandler = () => void;
export type SaveGeofenceHandler = (name: string) => GeofenceShapeHandle;
export type CancelGeofenceHandler = () => void;
export type EditGeofenceHandler = () => GeofenceShapeHandle;
export type RemoveGeofenceHandler = (id: string) => void;

/** Refs the vendored map editors populate with imperative draw handles. */
export interface GeofenceEditorHandles {
  addRef?: RefObject<AddGeofenceHandler | null>;
  saveRef?: RefObject<SaveGeofenceHandler | null>;
  cancelRef?: RefObject<CancelGeofenceHandler | null>;
  editingRef?: RefObject<EditGeofenceHandler | null>;
  removeRef?: RefObject<RemoveGeofenceHandler | null>;
}

// Vendored (untyped) leaflet/google map editors — type the prop slice used.
interface MapEditorProps extends GeofenceEditorHandles {
  mapKey?: string | null;
  initialPolygons?: MapPolygon[];
  selectedPolygon?: string | null;
  handleSelected?: (value: string | null) => void;
  setIsEditing: (editing: boolean) => void;
  setOpen?: (open: boolean) => void;
  height?: string;
}
const OSMGeofenceEditor = OSMGeofenceEditorBase as unknown as (props: MapEditorProps) => ReactNode;
const GoogleGeofenceEditor = GoogleGeofenceEditorBase as unknown as (props: MapEditorProps) => ReactNode;

interface GeofenceEditorProps extends GeofenceEditorHandles {
  mapType: 'OSM' | 'Google';
  mapKey?: string | null;
  geofences?: MapPolygon[];
  selectedGeofence?: string | null;
  handleSelected?: (value: string | null) => void;
  setOpen?: (open: boolean) => void;
  handleAdd?: () => void;
  handleEdit?: () => void;
  height?: string;
}

const GeofenceEditor = ({
    mapType,
    mapKey,
    geofences,
    selectedGeofence,
    handleSelected,
    setOpen,
    addRef,
    saveRef,
    cancelRef,
    editingRef,
    removeRef,
    handleAdd,
    handleEdit,
    height = '70vh'
    }: GeofenceEditorProps) => {

  const [isEditing, setIsEditing] = useState(false);

  return (
    <MapControlStyle>
        {mapType === 'OSM' ? (
            <OSMGeofenceEditor
                initialPolygons={geofences}
                selectedPolygon={selectedGeofence}
                handleSelected={handleSelected}
                setIsEditing={setIsEditing}
                setOpen={setOpen}
                addRef={addRef}
                saveRef={saveRef}
                cancelRef={cancelRef}
                editingRef={editingRef}
                removeRef={removeRef}
                height={height}
            />
            ) : (
                mapType === 'Google' &&
                <GoogleGeofenceEditor
                    mapKey={mapKey}
                    initialPolygons={geofences}
                    selectedPolygon={selectedGeofence}
                    handleSelected={handleSelected}
                    setIsEditing={setIsEditing}
                    setOpen={setOpen}
                    addRef={addRef}
                    saveRef={saveRef}
                    cancelRef={cancelRef}
                    editingRef={editingRef}
                    removeRef={removeRef}
                    height={height}
                />
            )}
        <div className="mapcontrol">
        <label className="mapcontrol-label" onClick={handleAdd}>&nbsp;+&nbsp;</label>
        {isEditing && <label className="mapcontrol-label" onClick={handleEdit}>&nbsp;💾&nbsp;</label>}
        </div>
    </MapControlStyle>
  );
}

export default GeofenceEditor;
