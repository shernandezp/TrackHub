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
 * Handles saving a transporter type.
 * @param {Object} transporterType - The transporter type to be saved.
 * @param {Array} transporterTypeList - The current list of transporter types.
 * @param {Function} setTransporterTypeList - The function to update the list of transporter types.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} updateTransporterType - The function to update an existing transporter type.
 * @param {Array} transporterTypes - The base list of transporter types.
 * @returns {Promise<void>}
 */
export async function handleSave(transporterType, transporterTypeList, setTransporterTypeList, setData, buildTableData, updateTransporterType, transporterTypes) {
    let response = await updateTransporterType(transporterType.transporterTypeId, transporterType);
    if (response) {
        const selectedTransporterType = transporterTypes.find(pt => pt.value === transporterType.transporterTypeId);
        transporterType.type = selectedTransporterType.label;
        const updatedTransporterTypes = [...transporterTypeList];
        const index = updatedTransporterTypes.findIndex(a => a.transporterTypeId === transporterType.transporterTypeId);
        updatedTransporterTypes[index] = transporterType;
        setTransporterTypeList(updatedTransporterTypes);
        setData(buildTableData(updatedTransporterTypes));
    }
}