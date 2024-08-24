import useApiService from './apiService';
import { handleError, handleSilentError } from 'utils/errorHandler';

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
