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

import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';

/**
 * Service for managing transporter type-related operations.
 * @returns {Object} Object containing functions for transporter type operations.
 */
const useTransporterTypeService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  /**
   * Retrieves a transporter type by its ID.
   * @param {string} transporterTypeId - The ID of the transporter type to retrieve.
   * @returns {Promise<Object>} A promise that resolves to the retrieved transporter type.
   */
  const getTransporterType = async (transporterTypeId) => {
    try {
      const data = {
        query: `
          query {
            transporterType(query: { transporterTypeId: "${transporterTypeId}" }) {
              accBased
              transporterTypeId
              stoppedGap
              maxTimeGap
              maxDistance
            }
          }
        `
      };
      const response = await post(data);
      return response.data.transporterType;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves all transporter types.
   * @returns {Promise<Array>} A promise that resolves to an array of all transporter types.
   */
  const getTransporterTypes = async () => {
    try {
      const data = {
        query: `
          query {
            transporterTypes {
              transporterTypeId
              stoppedGap
              maxTimeGap
              maxDistance
              accBased
              type
            }
          }
        `
      };
      const response = await post(data);
      return response.data.transporterTypes;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Updates an existing transporter type.
   * @param {string} transporterTypeId - The ID of the transporter type to update.
   * @param {Object} transporteTypeData - The updated data of the transporter type.
   * @returns {Promise<Object|boolean>} A promise that resolves to the updated transporter type if successful, or false if an error occurred.
   */
  const updateTransporterType = async (transporterTypeId, transporterTypeData) => {
    try {
      const data = {
        query: `
          mutation {
            updateTransporterType(
              id: ${transporterTypeId},
              command: {
                transporterType: {
                  transporterTypeId: ${transporterTypeData.transporterTypeId},
                  stoppedGap: ${transporterTypeData.stoppedGap},
                  maxTimeGap: ${transporterTypeData.maxTimeGap},
                  maxDistance: ${transporterTypeData.maxDistance},
                  accBased: ${transporterTypeData.accBased},
                }
              }
            )
          }
        `
      };
      const response = await post(data);
      return response.data.updateTransporterType;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getTransporterType,
    getTransporterTypes,
    updateTransporterType
  };
};

export default useTransporterTypeService;
