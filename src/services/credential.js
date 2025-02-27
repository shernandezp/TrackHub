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
 * A service for managing credentials.
 * @module useCredentialService
 */

import useApiService from './apiService';
import { handleError, handleSilentError } from 'utils/errorHandler';

/**
 * A custom hook that provides functions for interacting with credentials.
 * @returns {Object} An object containing functions for managing credentials.
 */
const useCredentialService = () => {
    const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

    /**
     * Retrieves a credential by operator ID.
     * @param {string} operatorId - The ID of the operator.
     * @returns {Promise<Object>} A promise that resolves to the credential.
     */
    const getCredentialByOperator = async (operatorId) => {
        try {
            const data = {
                query: `
                    query {
                        credentialByOperator(query: { operatorId: "${operatorId}" }) {
                            credentialId
                            key
                            key2
                            password
                            uri
                            username
                        }
                    }
                `
            };
            const response = await post(data);
            return response.data.credentialByOperator;
        } catch (error) {
            handleSilentError(error);
        }
    };

    /**
     * Creates a new credential.
     * @param {Object} credentialData - The data of the credential to create.
     * @returns {Promise<Object>} A promise that resolves to the created credential.
     */
    const createCredential = async (credentialData) => {
        try {
            const data = {
                query: `
                    mutation {
                        createCredential(
                        command: {
                            credential: {
                                key: "${credentialData.key ?? ''}",
                                key2: "${credentialData.key2 ?? ''}",
                                operatorId: "${credentialData.operatorId}",
                                password: "${credentialData.password ?? ''}",
                                uri: "${credentialData.uri}",
                                username: "${credentialData.username ?? ''}"
                            }
                        }) 
                        {
                            username
                            uri
                            password
                            key2
                            key
                            credentialId
                        }
                    }
                `
            };
            const response = await post(data);
            return response.data.createAccount;
        } catch (error) {
            handleError(error);
        }
    };

    /**
     * Updates a credential.
     * @param {string} credentialId - The ID of the credential to update.
     * @param {Object} credentialData - The updated data of the credential.
     * @returns {Promise<Object>} A promise that resolves to the updated credential.
     */
    const updateCredential = async (credentialId, credentialData) => {
        try {
            const data = {
                query: `
                mutation {
                        updateCredential(
                            id: "${credentialId}",
                            command: {
                                credential: {
                                    credentialId: "${credentialData.credentialId}"
                                    key2: "${credentialData.key2}"
                                    key: "${credentialData.key}"
                                    password: "${credentialData.password}"
                                    uri: "${credentialData.uri}"
                                    username: "${credentialData.username}"
                                }
                            }
                        ) 
                    }
                `
            };
            const response = await post(data);
            return response.data.updateCredential;
        } catch (error) {
            handleError(error);
            return false;
        }
    };

    return {
        getCredentialByOperator,
        createCredential,
        updateCredential
    };
};

export default useCredentialService;
