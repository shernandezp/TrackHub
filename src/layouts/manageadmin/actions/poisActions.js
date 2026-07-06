/**
* Copyright (c) 2026 Sergio Hernandez. All rights reserved.
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
 * Handles adding a new point of interest.
 * @param {Object} poi - The point of interest to be added.
 * @param {Array} pois - The current list of points of interest.
 * @param {Function} setPois - The function to update the list of points of interest.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createPointOfInterest - The function to create a new point of interest.
 * @returns {Promise<void>}
 */
async function handleAdd(poi, pois, setPois, setData, buildTableData, createPointOfInterest) {
    let response = await createPointOfInterest(poi);
    if (response) {
        const updatedPois = [...pois, response];
        setPois(updatedPois);
        setData(buildTableData(updatedPois));
    }
}

/**
 * Handles editing an existing point of interest.
 * @param {Object} poi - The point of interest to be edited.
 * @param {Array} pois - The current list of points of interest.
 * @param {Function} setPois - The function to update the list of points of interest.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} updatePointOfInterest - The function to update an existing point of interest.
 * @returns {Promise<void>}
 */
async function handleEdit(poi, pois, setPois, setData, buildTableData, updatePointOfInterest) {
    let response = await updatePointOfInterest(poi.pointOfInterestId, poi);
    if (response) {
        const updatedPois = [...pois];
        const index = updatedPois.findIndex(a => a.pointOfInterestId === poi.pointOfInterestId);
        updatedPois[index] = poi;
        setPois(updatedPois);
        setData(buildTableData(updatedPois));
    }
}

/**
 * Handles saving a point of interest by either adding or editing it.
 * @param {Object} poi - The point of interest to be saved.
 * @param {Array} pois - The current list of points of interest.
 * @param {Function} setPois - The function to update the list of points of interest.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createPointOfInterest - The function to create a new point of interest.
 * @param {Function} updatePointOfInterest - The function to update an existing point of interest.
 * @returns {Promise<void>}
 */
export async function handleSave(poi, pois, setPois, setData, buildTableData, createPointOfInterest, updatePointOfInterest) {
    if (!poi.pointOfInterestId) {
        await handleAdd(poi, pois, setPois, setData, buildTableData, createPointOfInterest);
    } else {
        await handleEdit(poi, pois, setPois, setData, buildTableData, updatePointOfInterest);
    }
}

/**
 * Handles deleting a point of interest.
 * @param {string} pointOfInterestId - The ID of the point of interest to be deleted.
 * @param {Array} pois - The current list of points of interest.
 * @param {Function} setPois - The function to update the list of points of interest.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} deletePointOfInterest - The function to delete a point of interest.
 * @returns {Promise<void>}
 */
export async function handleDelete(pointOfInterestId, pois, setPois, setData, buildTableData, deletePointOfInterest) {
    let response = await deletePointOfInterest(pointOfInterestId);
    if (response) {
        const updatedPois = pois.filter(a => a.pointOfInterestId !== pointOfInterestId);
        setPois(updatedPois);
        setData(buildTableData(updatedPois));
    }
}
