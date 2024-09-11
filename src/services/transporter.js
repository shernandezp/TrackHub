
/**
 * Service for managing transporters.
 * @module useTransporterService
 */

import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';

/**
 * Creates a new instance of the transporter service.
 * @returns {Object} The transporter service object.
 */
const useTransporterService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  /**
   * Retrieves a transporter by its ID.
   * @param {string} transporterId - The ID of the transporter.
   * @returns {Promise<Object>} A promise that resolves to the transporter object.
   */
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

  /**
   * Retrieves transporters associated with the current account.
   * @returns {Promise<Array>} A promise that resolves to an array of transporters.
   */
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

  /**
   * Retrieves transporters associated with a specific group.
   * @param {string} groupId - The ID of the group.
   * @returns {Promise<Array>} A promise that resolves to an array of transporters.
   */
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
      return response.data.transportersByGroup;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Creates a new transporter.
   * @param {Object} transporterData - The data of the transporter to create.
   * @returns {Promise<Object>} A promise that resolves to the created transporter object.
   */
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

  /**
   * Updates an existing transporter.
   * @param {string} transporterId - The ID of the transporter to update.
   * @param {Object} transporterData - The updated data of the transporter.
   * @returns {Promise<Object|boolean>} A promise that resolves to the updated transporter object, or false if the update fails.
   */
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

  /**
   * Deletes a transporter.
   * @param {string} transporterId - The ID of the transporter to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the deletion is successful, or false otherwise.
   */
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
