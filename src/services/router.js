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
 * Module for handling connectivity related operations.
 * @module connectivity
 */

import useApiService from './apiService';
import { handleSilentError, handleError } from 'utils/errorHandler';

/**
 * Custom hook for handling router service operations.
 * @returns {Object} Object containing functions for testing connectivity and getting devices by operator.
 */
const useRouterService = () => {
    const { post } = useApiService(process.env.REACT_APP_ROUTER_ENDPOINT);

    /**
     * Tests connectivity with the specified operator.
     * @param {string} operatorId - The ID of the operator to test connectivity with.
     * @returns {boolean} True if connectivity test is successful, false otherwise.
     */
    const testConnectivity = async (operatorId) => {
        try {
            const data = {
                query: `
                    query {
                        pingOperator(query: { operatorId: "${operatorId}" }) 
                    }
                `
            };
            const response = await post(data);
            return response.data.pingOperator;
        } catch (error) {
            handleSilentError(error);
            return false;
        }
    };
    
    /**
     * Retrieves devices associated with the specified operator.
     * @param {string} operatorId - The ID of the operator to retrieve devices for.
     * @returns {Array} Array of devices associated with the operator.
     */
    const getDevicesByOperator = async (operatorId) => {
        try {
          const data = {
            query: `
                query {
                    devicesByOperator(query: { operatorId: "${operatorId}" }) {
                        identifier
                        name
                        serial
                        deviceTypeId
                        transporterTypeId
                    }
                }
            `
          };
          const response = await post(data);
          return response.data.devicesByOperator;
        } catch (error) {
          handleError(error);
        }
      };

    const getPositions = async () => {
        try {
          const data = {
            query: `
                query {
                    positionsByUser {
                        attributes {
                            temperature
                            satellites
                            mileage
                            ignition
                            hobbsMeter
                        }
                        altitude
                        address
                        deviceName
                        transporterType
                        state
                        speed
                        serverDateTime
                        longitude
                        latitude
                        eventId
                        transporterId
                        deviceDateTime
                        course
                        country
                        city
                    }
                }
            `
          };
          const response = await post(data);
          return response.data.positionsByUser;
        } catch (error) {
          handleError(error);
        }
      };

    return {
        testConnectivity,
        getDevicesByOperator,
        getPositions
    };
};

export default useRouterService;
