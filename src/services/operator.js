/**
 * Service for managing operators.
 * @module useOperatorService
 */

import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

/**
 * Creates an instance of the operator service.
 * @returns {Object} The operator service object.
 */
const useOperatorService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  /**
   * Retrieves an operator by ID.
   * @param {string} operatorId - The ID of the operator.
   * @returns {Promise<Object>} A promise that resolves to the operator object.
   */
  const getOperator = async (operatorId) => {
    try {
      const data = {
        query: `
            query {
                operator(query: "${operatorId}") {
                address
                contactName
                description
                emailAddress
                lastModified
                name
                operatorId
                phoneNumber
                protocolType
                protocolTypeId
                }
            }
        `
      };
      const response = await post(data);
      return response.data.operator;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves operators by the current account.
   * @returns {Promise<Array>} A promise that resolves to an array of operators.
   */
  const getOperatorsByCurrentAccount = async () => {
    try {
      const data = {
        query: `
        query {
            operatorsByCurrentAccount {
              address
              contactName
              description
              emailAddress
              lastModified
              name
              operatorId
              phoneNumber
              protocolType
              protocolTypeId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.operatorsByCurrentAccount;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves simple list of operators by the current account.
   * @returns {Promise<Array>} A promise that resolves to an array of operators.
   */
  const getOperators = async () => {
    try {
      const data = {
        query: `
          query {
              operatorsByCurrentAccount {
                name
                operatorId
              }
            }
        `
      };
      const response = await post(data);
      return response.data.operatorsByCurrentAccount;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves operators by account ID.
   * @param {string} accountId - The ID of the account.
   * @returns {Promise<Array>} A promise that resolves to an array of operators.
   */
  const getOperatorByAccount = async (accountId) => {
    try {
      const data = {
        query: `
        query {
            operatorsByAccount(query: "${accountId}") {
              address
              contactName
              description
              emailAddress
              lastModified
              name
              operatorId
              phoneNumber
              protocolType
              protocolTypeId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.operatorsByAccount;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Creates a new operator.
   * @param {Object} operatorData - The data of the operator to create.
   * @returns {Promise<Object>} A promise that resolves to the created operator object.
   */
  const createOperator = async (operatorData) => {
    try {
      const data = {
        query: `
            mutation {
                createOperator(
                command: {
                    operator: {
                    address: ${formatValue(operatorData.address)}
                    contactName: ${formatValue(operatorData.contactName)}
                    protocolTypeId: ${operatorData.protocolTypeId}
                    phoneNumber: ${formatValue(operatorData.phoneNumber)}
                    name: ${formatValue(operatorData.name)}
                    emailAddress: ${formatValue(operatorData.emailAddress)}
                    description: ${formatValue(operatorData.description)}
                    }
                }
                ) {
                address
                contactName
                description
                emailAddress
                lastModified
                name
                operatorId
                phoneNumber
                protocolType
                protocolTypeId
                }
            }
        `
      };
      const response = await post(data);
      return response.data.createOperator;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Updates an existing operator.
   * @param {string} operatorId - The ID of the operator to update.
   * @param {Object} operatorData - The updated data of the operator.
   * @returns {Promise<Object>} A promise that resolves to the updated operator object.
   */
  const updateOperator = async (operatorId, operatorData) => {
    try {
      const data = {
        query: `
            mutation {
                updateOperator(
                id: "${operatorId}",
                command: {
                    operator: {
                    protocolTypeId: ${operatorData.protocolTypeId}
                    phoneNumber: ${formatValue(operatorData.phoneNumber)}
                    operatorId: "${operatorId}"
                    name: ${formatValue(operatorData.name)}
                    emailAddress: ${formatValue(operatorData.emailAddress)}
                    description: ${formatValue(operatorData.description)}
                    address: ${formatValue(operatorData.address)}
                    contactName: ${formatValue(operatorData.contactName)}
                    }
                }
                ) 
            }
        `
      };
      const response = await post(data);
      return response.data.updateOperator;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  /**
   * Deletes an operator.
   * @param {string} operatorId - The ID of the operator to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the operator is deleted successfully, false otherwise.
   */
  const deleteOperator = async (operatorId) => {
    try {
      const data = {
        query: `
            mutation {
                deleteOperator(id: "${operatorId}")
            }
        `
      };
      const response = await post(data);
      return response.data.deleteOperator;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getOperator,
    getOperatorsByCurrentAccount,
    getOperatorByAccount,
    getOperators,
    createOperator,
    updateOperator,
    deleteOperator,
  };
};

export default useOperatorService;
