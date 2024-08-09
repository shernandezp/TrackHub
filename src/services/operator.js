import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';

const useOperatorService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

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

  const createOperator = async (operatorData) => {
    try {
      const data = {
        query: `
            mutation {
                createOperator(
                command: {
                    operator: {
                    accountId: "${operatorData.accountId}"
                    address: "${operatorData.address}"
                    contactName: "${operatorData.contactName}"
                    protocolTypeId: ${operatorData.protocolTypeId}
                    phoneNumber: "${operatorData.phoneNumber}"
                    name: "${operatorData.name}"
                    emailAddress: "${operatorData.emailAddress}"
                    description: "${operatorData.description}"
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
                    phoneNumber: "${operatorData.phoneNumber}"
                    operatorId: "${operatorId}"
                    name: "${operatorData.name}"
                    emailAddress: "${operatorData.emailAddress}"
                    description: "${operatorData.description}"
                    address: "${operatorData.address}"
                    contactName: "${operatorData.contactName}"
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
    createOperator,
    updateOperator,
    deleteOperator,
  };
};

export default useOperatorService;
