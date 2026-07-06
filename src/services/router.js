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
 * Module for handling connectivity related operations.
 * @module connectivity
 */

import useApiService from './apiService';
import { handleSilentError, handleError } from 'utils/errorHandler';
import { formatDateTimeOffSet } from "utils/dataUtils";

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
                providerDevicesByOperator(query: { operatorId: "${operatorId}" }) {
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
          return response.data.providerDevicesByOperator;
        } catch (error) {
          handleError(error);
          return [];
        }
      };

    /**
     * Retrieves position of devices associated with the current user.
     * @returns {Array} Array of devices associated with the operator.
     */
    const getDevicePositions = async () => {
      try {
        const data = {
          query: `
            query {
              devicePositionsByUser {
                attributes {
                  temperature
                  satellites
                  mileage
                  ignition
                  hourmeter
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
        return response.data.devicePositionsByUser;
      } catch (error) {
        handleError(error);
        return [];
      }
    };

    /**
     * Builds the optional history source argument (PROVIDER | STORED).
     * The argument is omitted entirely when no source is provided so the
     * backend default behavior is preserved.
     * @param {string} [source] - 'PROVIDER' or 'STORED'.
     * @returns {string} GraphQL argument fragment or empty string.
     */
    const buildSourceArg = (source) =>
      source === 'PROVIDER' || source === 'STORED' ? `, source: ${source}` : '';

    /**
     * Retrieves trips associated with the specified transporter and date range.
     * @param {string} transporterId - The ID of the transporte to retrieve trips for.
     * @param {string} from - The start of the range.
     * @param {string} to - The end of the range.
     * @param {string} [source] - Optional history source ('PROVIDER' | 'STORED').
     * @returns {Array} Array of trips associated with the transporter and date range.
     */
    const getTripsByTransporter = async (transporterId, from, to, source) => {
      try {
        const data = {
          query: `
            query {
              tripsByTransporter(query: { transporterId: "${transporterId}", to: "${formatDateTimeOffSet(to)}", from: "${formatDateTimeOffSet(from)}"${buildSourceArg(source)} }) {
                averageSpeed
                duration
                totalDistance
                tripId
                type
                from
                to
                points {
                  course
                  deviceDateTime
                  eventId
                  latitude
                  longitude
                  speed
                }
              }
            }
          `
        };
        const response = await post(data);
        return response.data.tripsByTransporter;
      } catch (error) {
        handleError(error);
        return [];
      }
    };

    /**
     * Retrieves raw positions for the specified transporter and date range.
     * @param {string} transporterId - The ID of the transporter to retrieve positions for.
     * @param {string} from - The start of the range.
     * @param {string} to - The end of the range.
     * @param {string} [source] - Optional history source ('PROVIDER' | 'STORED').
     * @returns {Array} Array of positions for the transporter and date range.
     */
    const getPositionsByTransporter = async (transporterId, from, to, source) => {
      try {
        const data = {
          query: `
            query {
              positionsByTransporter(query: { transporterId: "${transporterId}", to: "${formatDateTimeOffSet(to)}", from: "${formatDateTimeOffSet(from)}"${buildSourceArg(source)} }) {
                deviceName
                transporterId
                latitude
                longitude
                altitude
                speed
                course
                deviceDateTime
                serverDateTime
                eventId
                address
                city
                state
                country
              }
            }
          `
        };
        const response = await post(data);
        return response.data.positionsByTransporter;
      } catch (error) {
        handleError(error);
        return [];
      }
    };

    /**
     * Resolves a human-readable address for a coordinate on demand.
     * When a transporterId is provided the backend also persists the resolved
     * address onto the transporter's latest-position row.
     * @param {number} latitude - The latitude to resolve.
     * @param {number} longitude - The longitude to resolve.
     * @param {string} [transporterId] - Optional ID of the transporter the coordinate belongs to.
     * @returns {Object|null} { address, city, state, country } or null when unavailable.
     */
    const reverseGeocode = async (latitude, longitude, transporterId) => {
      try {
        const transporterArg = transporterId ? `, transporterId: "${transporterId}"` : '';
        const data = {
          query: `
            query {
              reverseGeocode(query: { latitude: ${latitude}, longitude: ${longitude}${transporterArg} }) {
                address
                city
                state
                country
              }
            }
          `
        };
        const response = await post(data);
        return response.data.reverseGeocode;
      } catch (error) {
        handleSilentError(error);
        return null;
      }
    };

    return {
        testConnectivity,
        getDevicesByOperator,
        getDevicePositions,
        getTripsByTransporter,
        getPositionsByTransporter,
        reverseGeocode
    };
};

export default useRouterService;
