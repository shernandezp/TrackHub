/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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

import React, { useState } from 'react';
import PropTypes from "prop-types";
import OSMGeofenceEditor from 'controls/Maps/OSM/GeofenceEditor';
import GoogleGeofenceEditor from 'controls/Maps/Google/GeofenceEditor';
import MapControlStyle from 'controls/Maps/styles/MapControl';

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
    handleEdit
    }) => {

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
                />
            )}
        <div className="mapcontrol">
        <label className="mapcontrol-label" onClick={handleAdd}>&nbsp;+&nbsp;</label>
        {isEditing && <label className="mapcontrol-label" onClick={handleEdit}>&nbsp;💾&nbsp;</label>}
        </div>
    </MapControlStyle>
  );
}

GeofenceEditor.propTypes = {
    mapType: PropTypes.oneOf(['OSM', 'Google']).isRequired,
    mapKey: PropTypes.string,
    geofences: PropTypes.array,
    selectedGeofence: PropTypes.string,
    handleSelected: PropTypes.func,
    setOpen: PropTypes.func,
    addRef: PropTypes.object,
    saveRef: PropTypes.object,
    cancelRef: PropTypes.object,
    editingRef: PropTypes.object,
    removeRef: PropTypes.object,
    handleAdd: PropTypes.func,
    handleEdit: PropTypes.func,
};

export default GeofenceEditor;
