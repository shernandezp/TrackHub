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

/**
 * Handles adding a new geofence.
 * 
 * @param {Object} geofence - The geofence object to add.
 * @param {Array} geofences - The current list of geofences.
 * @param {Function} setGeofences - Function to update the list of geofences.
 * @param {Function} setData - Function to update the table data.
 * @param {Function} buildTableData - Function to build the table data from the geofences.
 * @param {Function} createGeofence - Function to create a new geofence.
 * @returns {Promise<void>}
 */
async function handleAdd(geofence, geofences, setGeofences, setData, buildTableData, createGeofence) {
    let response = await createGeofence(geofence);
    if (response) {
        const updatedGeofences = [...geofences, response];
        setGeofences(updatedGeofences);
        setData(buildTableData(updatedGeofences));
    }
}

/**
 * Handles editing an existing geofence.
 * 
 * @param {Object} geofence - The geofence object to edit.
 * @param {Array} geofences - The current list of geofences.
 * @param {Function} setGeofences - Function to update the list of geofences.
 * @param {Function} setData - Function to update the table data.
 * @param {Function} buildTableData - Function to build the table data from the geofences.
 * @param {Function} updateGeofence - Function to update an existing geofence.
 * @returns {Promise<void>}
 */
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

/**
 * Handles saving a geofence, either by adding a new one or editing an existing one.
 * 
 * @param {Object} geofence - The geofence object to save.
 * @param {Array} geofences - The current list of geofences.
 * @param {Function} setGeofences - Function to update the list of geofences.
 * @param {Function} setData - Function to update the table data.
 * @param {Function} buildTableData - Function to build the table data from the geofences.
 * @param {Function} createGeofence - Function to create a new geofence.
 * @param {Function} updateGeofence - Function to update an existing geofence.
 * @returns {Promise<void>}
 */
export async function handleSave(geofence, geofences, setGeofences, setData, buildTableData, createGeofence, updateGeofence) {
    if (geofence.new) {
        await handleAdd(geofence, geofences, setGeofences, setData, buildTableData, createGeofence);
    } else {
        await handleEdit(geofence, geofences, setGeofences, setData, buildTableData, updateGeofence);
    }
}

/**
 * Handles deleting a geofence.
 * 
 * @param {string} geofenceId - The ID of the geofence to delete.
 * @param {Array} geofences - The current list of geofences.
 * @param {Function} setGeofences - Function to update the list of geofences.
 * @param {Function} setData - Function to update the table data.
 * @param {Function} buildTableData - Function to build the table data from the geofences.
 * @param {Function} deleteGeofence - Function to delete a geofence.
 * @returns {Promise<void>}
 */
export async function handleDelete(geofenceId, geofences, setGeofences, setData, buildTableData, deleteGeofence) {
    let response = await deleteGeofence(geofenceId);
    if (response) {
        const updatedGeofences = geofences.filter(a => a.geofenceId !== geofenceId);
        setGeofences(updatedGeofences);
        setData(buildTableData(updatedGeofences));
    }
}