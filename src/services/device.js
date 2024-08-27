
/**
 * A service for managing devices.
 * @module useDeviceService
 */

import useApiService from './apiService';
import { handleError, handleSilentError } from 'utils/errorHandler';

/**
 * Creates a device service object.
 * @returns {Object} The device service object.
 */
const useDeviceService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  /**
   * Retrieves a device by its ID.
   * @param {string} deviceId - The ID of the device.
   * @returns {Promise<Object>} A promise that resolves to the device object.
   */
  const getDevice = async (deviceId) => {
    try {
      const data = {
        query: `
          query {
            device(query: { id: "${deviceId}" }) {
              description
              deviceId
              deviceTypeId
              identifier
              name
              operatorId
              serial
              transporterId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.device;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves devices associated with the current account.
   * @returns {Promise<Array>} A promise that resolves to an array of device objects.
   */
  const getDevicesByAccount = async () => {
    try {
      const data = {
        query: `
          query {
            devicesByAccount {
              description
              deviceId
              deviceType
              deviceTypeId
              identifier
              name
              operatorId
              serial
              transporterId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.devicesByAccount;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves devices associated with a specific group.
   * @param {string} groupId - The ID of the group.
   * @returns {Promise<Array>} A promise that resolves to an array of device objects.
   */
  const getDevicesByGroup = async (groupId) => {
    try {
      const data = {
        query: `
            query {
                devicesByGroup(query: { groupId: ${groupId} }) {
                    description
                    deviceId
                    deviceType
                    deviceTypeId
                    name
                }
            }
        `
      };
      const response = await post(data);
      return response.data.devicesByGroup;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Processes a device.
   * @param {Object} deviceData - The data of the device to be processed.
   * @param {string} operatorId - The ID of the operator.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating the success of the operation.
   */
  const processDevice = async (deviceData, operatorId) => {
    try {
      const data = {
        query: `
          mutation {
            processDevice(
              command: {
                processDevice: {
                  transporterTypeId: ${deviceData.transporterTypeId}
                  serial: "${deviceData.serial}"
                  name: "${deviceData.name}"
                  identifier: ${deviceData.identifier}
                  deviceTypeId: ${deviceData.deviceTypeId}
                  description: "${deviceData.description || ''}"
                }
                operatorId: "${operatorId}"
              }
            ) 
          }
        `
      };
      const response = await post(data);
      return response.data.processDevice;
    } catch (error) {
      handleSilentError(error);
      return false;
    }
  };

  /**
   * Deletes a device by its ID.
   * @param {string} deviceId - The ID of the device to be deleted.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating the success of the operation.
   */
  const deleteDevice = async (deviceId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteDevice(deviceId: "${deviceId}") 
          }
        `
      };
      const response = await post(data);
      return response.data.deleteDevice;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  /**
   * Wipes all devices associated with an operator.
   * @param {string} operatorId - The ID of the operator.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating the success of the operation.
   */
  const wipeDevices = async (operatorId) => {
    try {
      const data = {
        query: `
          mutation {
            wipeDevices(operatorId: "${operatorId}") 
          }
        `
      };
      const response = await post(data);
      return response.data.wipeDevices;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getDevice,
    getDevicesByAccount,
    getDevicesByGroup,
    processDevice,
    deleteDevice,
    wipeDevices
  };
};

export default useDeviceService;
