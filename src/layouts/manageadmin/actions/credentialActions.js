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

/**
 * Handles adding a new credential.
 * @param {Object} credential - The credential object to be added.
 * @param {Function} createCredential - The function to create a new credential.
 * @returns {Promise<void>} - A promise that resolves when the credential is created.
 */
async function handleAdd(credential, createCredential) {
    await createCredential(credential);
}

/**
 * Handles editing an existing credential.
 * @param {Object} credential - The updated credential object.
 * @param {Function} updateCredential - The function to update an existing credential.
 * @returns {Promise<void>} - A promise that resolves when the credential is updated.
 */
async function handleEdit(credential, updateCredential) {
    await updateCredential(credential.credentialId, credential);
}

/**
 * Handles saving a credential by either adding or editing it.
 * @param {Object} credential - The credential object to be saved.
 * @param {Function} createCredential - The function to create a new credential.
 * @param {Function} updateCredential - The function to update an existing credential.
 * @returns {Promise<void>} - A promise that resolves when the credential is saved.
 */
export async function handleSaveCredential(credential, createCredential, updateCredential) {
    if (!credential.credentialId) {
        await handleAdd(credential, createCredential);
    } else {
        await handleEdit(credential, updateCredential);
    }
}

/**
 * Handles testing the connectivity of a credential.
 * @param {string} operatorId - The ID of the operator to test connectivity for.
 * @param {Function} testConnectivity - The function to test the connectivity of an operator.
 * @returns {Promise<any>} - A promise that resolves with the test result.
 */
export async function handleTestCredential(operatorId, testConnectivity) {
    return await testConnectivity(operatorId);
}
