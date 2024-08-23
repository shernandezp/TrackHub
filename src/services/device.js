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

  const getDevicesByAccount = async () => {
    try {
      const data = {
        query: `
          query {
            devicesByAccount {
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

  const createDevice = async (deviceData) => {
    try {
      const data = {
        query: `
          mutation {
            createDevice(
              command: {
                device: {
                  transporterId: "${deviceData.transporterId}"
                  serial: "${deviceData.serial}"
                  operatorId: "${deviceData.operatorId}"
                  name: "${deviceData.name}"
                  identifier: "${deviceData.identifier}"
                  deviceTypeId: ${deviceData.deviceTypeId}
                  description: "${deviceData.description}"
                }
              }
            ) {
              transporterId
              serial
              operatorId
              name
              deviceTypeId
              deviceId
              identifier
              description
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
                  transporterId: "${deviceData.transporterId}"
                  serial: "${deviceData.serial}"
                  operatorId: "${deviceData.operatorId}"
                  name: "${deviceData.name}"
                  identifier: "${deviceData.identifier}"
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

  return {
    getDevice,
    getDevicesByAccount,
    getDevicesByGroup,
    createDevice,
    updateDevice,
    deleteDevice
  };
};

export default useDeviceService;
