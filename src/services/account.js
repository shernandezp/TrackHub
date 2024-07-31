import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';

const useAccountService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  const getAccount = async (accountId) => {
    try {
      const data = {
        query: `
          query {
            account(query: { id: "${accountId}" }) {
              accountId
              active
              description
              lastModified
              name
              type
            }
          }
        `
      };
      const response = await post(data);
      return response.account;
    } catch (error) {
      handleError(error);
    }
  };

  const getAccountByUser = async () => {
    try {
      const data = {
        query: `
          query {
            accountByUser {
              accountId
              active
              description
              lastModified
              name
              type
            }
          }
        `
      };
      const response = await post(data);
      return response.data.accountByUser;
    } catch (error) {
      handleError(error);
    }
  };

  const getAccounts = async () => {
    try {
      const data = {
        query: `
          query {
            accounts {
              accountId
              active
              description
              lastModified
              name
              type
            }
          }
        `
      };
      const response = await post(data);
      return response.accounts;
    } catch (error) {
      handleError(error);
    }
  };

  const createAccount = async (accountData) => {
    try {
      const data = {
        query: `
          mutation {
            createAccount(
              command: { account: { 
                active: ${accountData.active},
                description: "${accountData.description}",
                name: "${accountData.name}",
                type: "${accountData.type}"
              } }
            ) {
              accountId
              active
              description
              lastModified
              name
              type
            }
          }
        `
      };
      const response = await post(data);
      return response.createAccount;
    } catch (error) {
      handleError(error);
    }
  };

  const updateAccount = async (accountId, accountData) => {
    try {
      const data = {
        query: `
          mutation {
            updateAccount(
              id: "${accountId}",
              command: {
                account: {
                  type: ${accountData.type},
                  name: "${accountData.name}",
                  description: "${accountData.description}",
                  active: ${accountData.active},
                  accountId: "${accountData.accountId}"
                }
              }
            ) 
          }
        `
      };
      const response = await post(data);
      return response.updateAccount;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  const deleteAccount = async (accountId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteAccount(id: "${accountId}")
          }
        `
      };
      const response = await post(data);
      return response.deleteAccount;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getAccount,
    getAccountByUser,
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
  };
};

export default useAccountService;
