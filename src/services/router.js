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
                    positions {
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
                        deviceType
                        state
                        speed
                        serverDateTime
                        longitude
                        latitude
                        eventId
                        deviceId
                        deviceDateTime
                        course
                        country
                        city
                    }
                }
            `
          };
          const response = await post(data);
          return response.data.positions;
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
