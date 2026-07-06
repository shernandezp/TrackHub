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
 * Handles adding a new geocoding provider.
 * @param {Object} provider - The geocoding provider to be added.
 * @param {Array} providers - The current list of geocoding providers.
 * @param {Function} setProviders - The function to update the list of geocoding providers.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createGeocodingProvider - The function to create a new geocoding provider.
 * @returns {Promise<void>}
 */
async function handleAdd(provider, providers, setProviders, setData, buildTableData, createGeocodingProvider) {
    let response = await createGeocodingProvider(provider);
    if (response) {
        const updatedProviders = [...providers, response];
        setProviders(updatedProviders);
        setData(buildTableData(updatedProviders));
    }
}

/**
 * Handles editing an existing geocoding provider.
 * @param {Object} provider - The geocoding provider to be edited.
 * @param {Array} providers - The current list of geocoding providers.
 * @param {Function} setProviders - The function to update the list of geocoding providers.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} updateGeocodingProvider - The function to update an existing geocoding provider.
 * @returns {Promise<void>}
 */
async function handleEdit(provider, providers, setProviders, setData, buildTableData, updateGeocodingProvider) {
    let response = await updateGeocodingProvider(provider.geocodingProviderId, provider);
    if (response) {
        const updatedProviders = [...providers];
        const index = updatedProviders.findIndex(a => a.geocodingProviderId === provider.geocodingProviderId);
        updatedProviders[index] = provider;
        setProviders(updatedProviders);
        setData(buildTableData(updatedProviders));
    }
}

/**
 * Handles saving a geocoding provider by either adding or editing it.
 * @param {Object} provider - The geocoding provider to be saved.
 * @param {Array} providers - The current list of geocoding providers.
 * @param {Function} setProviders - The function to update the list of geocoding providers.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} createGeocodingProvider - The function to create a new geocoding provider.
 * @param {Function} updateGeocodingProvider - The function to update an existing geocoding provider.
 * @returns {Promise<void>}
 */
export async function handleSave(provider, providers, setProviders, setData, buildTableData, createGeocodingProvider, updateGeocodingProvider) {
    if (!provider.geocodingProviderId) {
        await handleAdd(provider, providers, setProviders, setData, buildTableData, createGeocodingProvider);
    } else {
        await handleEdit(provider, providers, setProviders, setData, buildTableData, updateGeocodingProvider);
    }
}

/**
 * Handles deleting a geocoding provider.
 * @param {string} geocodingProviderId - The ID of the geocoding provider to be deleted.
 * @param {Array} providers - The current list of geocoding providers.
 * @param {Function} setProviders - The function to update the list of geocoding providers.
 * @param {Function} setData - The function to update the data used for building the table.
 * @param {Function} buildTableData - The function to build the table data.
 * @param {Function} deleteGeocodingProvider - The function to delete a geocoding provider.
 * @returns {Promise<void>}
 */
export async function handleDelete(geocodingProviderId, providers, setProviders, setData, buildTableData, deleteGeocodingProvider) {
    let response = await deleteGeocodingProvider(geocodingProviderId);
    if (response) {
        const updatedProviders = providers.filter(a => a.geocodingProviderId !== geocodingProviderId);
        setProviders(updatedProviders);
        setData(buildTableData(updatedProviders));
    }
}
