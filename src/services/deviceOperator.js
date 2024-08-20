import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';

const useDeviceOperatorService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  const getDeviceOperator = async (deviceOperatorId) => {
    try {
      const data = {
        query: `
          query {
            deviceOperator(query: { id: ${deviceOperatorId} }) {
              deviceId
              deviceOperatorId
              identifier
              operatorId
              serial
            }
          }
        `
      };
      const response = await post(data);
      return response.data.deviceOperator;
    } catch (error) {
      handleError(error);
    }
  };

  const createDeviceOperator = async (deviceOperatorData) => {
    try {
      const data = {
        query: `
          mutation {
            createDeviceOperator(
              command: {
                deviceOperator: { 
                  serial: "${deviceOperatorData.serial}", 
                  operatorId: "${deviceOperatorData.operatorId}", 
                  identifier: "${deviceOperatorData.identifier}", 
                  deviceId: "${deviceOperatorData.deviceId}"
                }
              }
            ) {
                serial
                operatorId
                identifier
                deviceOperatorId
                deviceId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createDeviceOperator;
    } catch (error) {
      handleError(error);
    }
  };

  const updateDeviceOperator = async (deviceOperatorId, deviceOperatorData) => {
    try {
      const data = {
        query: `
          mutation {
            updateDeviceOperator(
              id: ${deviceOperatorId}
              command: {
                deviceOperator: {
                  serial: "${deviceOperatorData.serial}"
                  operatorId: "${deviceOperatorData.operatorId}"
                  identifier: "${deviceOperatorData.identifier}"
                  deviceOperatorId: ${deviceOperatorData.deviceOperatorId}
                  deviceId: "${deviceOperatorData.deviceId}"
                }
              }
            )
          }
        `
      };
      const response = await post(data);
      return response.data.updateDeviceOperator;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  const deleteDeviceOperator = async (deviceOperatorId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteDeviceOperator(deviceOperatorId: ${deviceOperatorId}) 
          }
        `
      };
      const response = await post(data);
      return response.data.deleteDeviceOperator;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getDeviceOperator,
    createDeviceOperator,
    updateDeviceOperator,
    deleteDeviceOperator
  };
};

export default useDeviceOperatorService;
