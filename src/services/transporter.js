import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';

const useTransporterService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  const getTransporter = async (transporterId) => {
    try {
      const data = {
        query: `
          query {
            transporter(query: { id: "${transporterId}" }) {
              transporterTypeId
              transporterType
              transporterId
              name
            }
          }
        `
      };
      const response = await post(data);
      return response.data.transporter;
    } catch (error) {
      handleError(error);
    }
  };

  const getTransporterByAccount = async () => {
    try {
      const data = {
        query: `
          query {
            transportersByAccount {
              name
              transporterId
              transporterType
              transporterTypeId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.transportersByAccount;
    } catch (error) {
      handleError(error);
    }
  };

  const getTransportersByGroup = async (groupId) => {
    try {
      const data = {
        query: `
          query {
            transportersByGroup(query: { groupId: ${groupId} }) {
              transporterTypeId
              transporterType
              transporterId
              name
            }
          }
        `
      };
      const response = await post(data);
      return response.data.transporter;
    } catch (error) {
      handleError(error);
    }
  };

  const createTransporter = async (transporterData) => {
    try {
      const data = {
        query: `
          mutation {
            createTransporter(
              command: { transporter: { 
                name: "${transporterData.name}", 
                transporterTypeId: ${transporterData.transporterTypeId},
              } }
            ) {
                name
                transporterId
                transporterType
                transporterTypeId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createTransporter;
    } catch (error) {
      handleError(error);
    }
  };

  const updateTransporter = async (transporterId, transporterData) => {
    try {
      const data = {
        query: `
          mutation {
            updateTransporter(
              command: {
                transporter: { 
                  transporterId: "${transporterId}", 
                  transporterTypeId: ${transporterData.transporterTypeId}, 
                  name: "${transporterData.name}"
                }
              }
              id: "${transporterId}"
            )
          }
        `
      };
      const response = await post(data);
      return response.data.updateTransporter;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  const deleteTransporter = async (transporterId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteTransporter(id: "${transporterId}")
          }
        `
      };
      const response = await post(data);
      return response.data.deleteTransporter;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getTransporter,
    getTransporterByAccount,
    getTransportersByGroup,
    createTransporter,
    updateTransporter,
    deleteTransporter
  };
};

export default useTransporterService;
