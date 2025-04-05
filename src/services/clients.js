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
 * A module that provides functions for interacting with client data.
 * @module useClientService
 */
import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

/**
 * Custom hook for client-related services.
 * @returns {Object} An object containing functions for client operations.
 */
const useClientService = () => {
  const { post } = useApiService(process.env.REACT_APP_SECURITY_ENDPOINT);

  /**
   * Retrieves all clients associated to the system.
   * @async
   * @returns {Promise<Array>} A promise that resolves to an array of client objects.
   */
  const getClients = async () => {
    try {
      const data = {
        query: `
          query {
            clients {
              clientId
              description
              name
              secret
              userId
              lastModified
            }
          }
        `
      };
      const response = await post(data);
      return response.data.clients;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Creates a new client.
   * @async
   * @param {Object} clientData - The data of the client to be created.
   * @returns {Promise<Object>} A promise that resolves to the created client object.
   */
  const createClient = async (clientData) => {
    try {
      const data = {
        query: `
          mutation {
            createClient(
              command: { 
                client: { 
                  name: ${formatValue(clientData.name)}, 
                  description: ${formatValue(clientData.description)}, 
                  secret: ${formatValue(clientData.secret)}, 
                  userId: ${formatValue(clientData.userId)} 
                } 
              }
            ) {
              name
              description
              secret
              userId
              clientId
              processed
              lastModified
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createClient;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Updates an existing client.
   * @async
   * @param {string} clientId - The ID of the client to be updated.
   * @param {Object} clientData - The updated data of the client.
   * @returns {Promise<Object>} A promise that resolves to the updated client object.
   */
  const updateClient = async (clientId, clientData) => {
    try {
      const data = {
        query: `
          mutation {
            updateClient(id: "${clientId}", 
            command: { 
              client: { 
                clientId: ${formatValue(clientData.clientId)}, 
                userId: ${formatValue(clientData.userId)}, 
              } 
            })
          }
        `
      };
      const response = await post(data);
      return response.data.updateClient;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  /**
   * Deletes a client.
   * @async
   * @param {string} clientId - The ID of the client to be deleted.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating the success of the deletion.
   */
  const deleteClient = async (clientId) => {
    try {
      const data = {
        query: `
            mutation {
              deleteClient(id: "${clientId}")
            }
        `
      };
      const response = await post(data);
      return response.data.deleteClient;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getClients,
    createClient,
    updateClient,
    deleteClient
  };
};

export default useClientService;
