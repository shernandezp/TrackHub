import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

/**
 * Service for managing account-related operations.
 * @returns {Object} Object containing functions for account operations.
 */
const useAccountService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  /**
   * Retrieves an account by its ID.
   * @param {string} accountId - The ID of the account to retrieve.
   * @returns {Promise<Object>} A promise that resolves to the retrieved account.
   */
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
      return response.data.account;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves the account associated with the current user.
   * @returns {Promise<Object>} A promise that resolves to the account associated with the current user.
   */
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

  /**
   * Retrieves all accounts.
   * @returns {Promise<Array>} A promise that resolves to an array of all accounts.
   */
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
              typeId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.accounts;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Creates a new account.
   * @param {Object} accountData - The data of the account to create.
   * @returns {Promise<Object>} A promise that resolves to the created account.
   */
  const createAccount = async (accountData) => {
    try {
      const data = {
        query: `
          mutation {
            createAccount(
              command: {
                account: {
                  active: ${accountData.active}
                  typeId: ${accountData.typeId}
                  password: ${formatValue(accountData.password)}
                  name: ${formatValue(accountData.name)}
                  lastName: ${formatValue(accountData.lastName)}
                  firstName: ${formatValue(accountData.firstName)}
                  emailAddress: ${formatValue(accountData.emailAddress)}
                  description: ${formatValue(accountData.description)}
                }
              }
            ) {
              accountId
              active
              description
              lastModified
              name
              type
              typeId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createAccount;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Updates an existing account.
   * @param {string} accountId - The ID of the account to update.
   * @param {Object} accountData - The updated data of the account.
   * @returns {Promise<Object|boolean>} A promise that resolves to the updated account if successful, or false if an error occurred.
   */
  const updateAccount = async (accountId, accountData) => {
    try {
      const data = {
        query: `
          mutation {
            updateAccount(
              id: "${accountId}",
              command: {
                account: {
                  typeId: ${accountData.typeId},
                  name: ${formatValue(accountData.name)},
                  description: ${formatValue(accountData.description)},
                  accountId: "${accountData.accountId}",
                  active: ${accountData.active},
                }
              }
            ) 
          }
        `
      };
      const response = await post(data);
      return response.data.updateAccount;
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
    updateAccount
  };
};

export default useAccountService;
