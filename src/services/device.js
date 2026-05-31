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
 * A service for managing devices.
 * @module useDeviceService
 */

import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

/**
 * Creates a device service object.
 * @returns {Object} The device service object.
 */
const useDeviceService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);
  const formatEnum = (value) => (/^[A-Za-z_][A-Za-z0-9_]*$/).test(String(value)) ? value : null;

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

  const wipeDevices = async (operatorId) => {
    try {
      const data = {
        query: `
          mutation {
            wipeDevices(operatorId: ${formatValue(operatorId)})
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

  const getSynchronizedDevices = async (accountId, detectedStatus = null, operatorId = null) => {
    try {
      const args = [`accountId: ${formatValue(accountId)}`];
      const detectedStatusValue = detectedStatus ? formatEnum(detectedStatus) : null;
      if (detectedStatusValue) args.push(`detectedStatus: ${detectedStatusValue}`);
      if (operatorId) args.push(`operatorId: ${formatValue(operatorId)}`);
      const data = {
        query: `
          query {
            synchronizedDevices(query: { ${args.join(', ')} }) {
              deviceId accountId operatorId serial name identifier
              providerDisplayName providerStatus detectedStatus
              firstSeenAt lastSeenAt lastSyncedAt lastAssignedAt ignoredAt
            }
          }
        `
      };
      const response = await post(data);
      return response.data.synchronizedDevices ?? [];
    } catch (error) {
      handleError(error);
      return [];
    }
  };

  const getUnassignedSynchronizedDevices = async (accountId) => {
    try {
      const data = {
        query: `
          query {
            unassignedSynchronizedDevices(query: { accountId: ${formatValue(accountId)} }) {
              deviceId operatorId serial name identifier providerDisplayName
              providerStatus detectedStatus firstSeenAt lastSeenAt
            }
          }
        `
      };
      const response = await post(data);
      return response.data.unassignedSynchronizedDevices ?? [];
    } catch (error) {
      handleError(error);
      return [];
    }
  };

  const setSynchronizedDeviceIgnored = async (deviceId, ignored) => {
    try {
      const data = {
        query: `
          mutation {
            setSynchronizedDeviceIgnored(command: { deviceId: ${formatValue(deviceId)}, ignored: ${!!ignored} })
          }
        `
      };
      const response = await post(data);
      return response.data.setSynchronizedDeviceIgnored;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getDevice,
    getDevicesByAccount,
    getDevicesByGroup,
    deleteDevice,
    wipeDevices,
    getSynchronizedDevices,
    getUnassignedSynchronizedDevices,
    setSynchronizedDeviceIgnored
  };
};

export default useDeviceService;
