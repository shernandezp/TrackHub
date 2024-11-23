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

async function handleAdd(geofence, geofences, setGeofences, setData, buildTableData, createGeofence) {
    let response = await createGeofence(geofence);
    if (response) {
        const updatedGeofences = [...geofences, response];
        setGeofences(updatedGeofences);
        setData(buildTableData(updatedGeofences));
    }
}

async function handleEdit(geofence, geofences, setGeofences, setData, buildTableData, updateGeofence) {
    let response = await updateGeofence(geofence.geofenceId, geofence);
    if (response) {
        const updatedGeofences = [...geofences];
        const index = updatedGeofences.findIndex(a => a.geofenceId === geofence.geofenceId);
        updatedGeofences[index] = geofence;
        setGeofences(updatedGeofences);
        setData(buildTableData(updatedGeofences));
    }
}

export async function handleSave(geofence, geofences, setGeofences, setData, buildTableData, createGeofence, updateGeofence) {
    if (geofence.new) {
        await handleAdd(geofence, geofences, setGeofences, setData, buildTableData, createGeofence);
    } else {
        await handleEdit(geofence, geofences, setGeofences, setData, buildTableData, updateGeofence);
    }
}

export async function handleDelete(geofenceId, geofences, setGeofences, setData, buildTableData, deleteGeofence) {
    let response = await deleteGeofence(geofenceId);
    if (response) {
        const updatedGeofences = geofences.filter(a => a.geofenceId !== geofenceId);
        setGeofences(updatedGeofences);
        setData(buildTableData(updatedGeofences));
    }
}