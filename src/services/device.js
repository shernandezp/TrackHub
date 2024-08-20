import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';

const useDeviceService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  const getDevice = async (deviceId) => {
    try {
      const data = {
        query: `
            query {
                device(query: { id: "${deviceId}" }) {
                    description
                    name
                    deviceType
                    deviceTypeId
                    deviceId
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

  const getDevicesByCurrentAccount = async () => {
    try {
      const data = {
        query: `
            query {
                devicesByCurrentAccount {
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
      return response.data.devicesByCurrentAccount;
    } catch (error) {
      handleError(error);
    }
  };

  const getDevicesByAccount = async (accountId) => {
    try {
      const data = {
        query: `
            query {
                devicesByAccount(query: { accountId: "${accountId}" }) {
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
      return response.data.devicesByAccount;
    } catch (error) {
      handleError(error);
    }
  };

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

  const getDevicesByUser = async () => {
    try {
      const data = {
        query: `
            query {
                devicesByUser {
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
      return response.data.devicesByUser;
    } catch (error) {
      handleError(error);
    }
  };

  const createDevice = async (deviceData) => {
    try {
      const data = {
        query: `
            mutation {
                createDevice(
                command: {
                    device: {
                        description: "${deviceData.description}",
                        deviceTypeId: ${deviceData.deviceTypeId},
                        name: "${deviceData.name}"
                    }}) {
                    description
                    deviceId
                    deviceType
                    deviceTypeId
                }
            }
        `
      };
      const response = await post(data);
      return response.data.createDevice;
    } catch (error) {
      handleError(error);
    }
  };

  const updateDevice = async (deviceId, deviceData) => {
    try {
      const data = {
        query: `
        mutation {
            updateDevice(
              id: "${deviceId}"
              command: {
                device: {
                  name: "${deviceData.name}"
                  deviceTypeId: ${deviceData.deviceTypeId}
                  deviceId: "${deviceData.deviceId}"
                  description: "${deviceData.description}"
                }
              }
            )
          }
        `
      };
      const response = await post(data);
      return response.data.updateDevice;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  const deleteDevice = async (deviceId) => {
    try {
      const data = {
        query: `
            mutation {
                deleteDevice(id: "${deviceId}")
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

  return {
    getDevice,
    getDevicesByCurrentAccount,
    getDevicesByAccount,
    getDevicesByGroup,
    getDevicesByUser,
    createDevice,
    updateDevice,
    deleteDevice
  };
};

export default useDeviceService;
