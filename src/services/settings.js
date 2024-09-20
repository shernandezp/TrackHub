
/**
 * Service for managing account and user settings.
 * @module useSettignsService
 */

import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

/**
 * Custom hook for managing account and user settings.
 * @returns {Object} An object containing functions for retrieving and updating settings.
 */
const useSettignsService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  /**
   * Retrieves the account settings.
   * @async
   * @returns {Promise<Object>} A promise that resolves to the account settings.
   */
  const getAccountSettings = async () => {
    try {
      const data = {
        query: `
            query {
                accountSettings 
                {
                    storeLastPosition
                    maps
                    accountId
                }
            }
        `
      };
      const response = await post(data);
      return response.data.accountSettings;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves the user settings.
   * @async
   * @returns {Promise<Object>} A promise that resolves to the user settings.
   */
  const getUserSettings = async () => {
    try {
      const data = {
        query: `
            query {
                userSettings 
                {
                    userId
                    style
                    language
                    navbar
                }
            }
        `
      };
      const response = await post(data);
      return response.data.userSettings;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Updates the account settings.
   * @async
   * @param {string} accountId - The ID of the account.
   * @param {Object} accountSettingsData - The updated account settings data.
   * @returns {Promise<boolean>} A promise that resolves to true if the update is successful, false otherwise.
   */
  const updateAccountSettings = async (accountId, accountSettingsData) => {
    try {
      const data = {
        query: `
            mutation {
                updateAccountSettings(
                command: { accountSettings: 
                    { 
                        storeLastPosition: ${accountSettingsData.storeLastPosition}, 
                        maps: ${formatValue(accountSettingsData.maps)}, 
                        accountId: "${accountSettingsData.accountId}" 
                    } 
                }
                id: "${accountId}"
                ) 
            }
        `
      };
      const response = await post(data);
      return response.data.updateAccountSettings;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  /**
   * Updates the user settings.
   * @async
   * @param {string} userId - The ID of the user.
   * @param {Object} userSettingsData - The updated user settings data.
   * @returns {Promise<boolean>} A promise that resolves to true if the update is successful, false otherwise.
   */
  const updateUserSettings = async (userId, userSettingsData) => {
    try {
      const data = {
        query: `
            mutation {
                updateUserSettings(
                command: { 
                    userSettings: 
                    { 
                        userId: "${userSettingsData.userId}", 
                        style: ${formatValue(userSettingsData.style)}, 
                        language: ${formatValue(userSettingsData.language)},
                        navbar: ${formatValue(userSettingsData.navbar)}
                    } 
                }
                id: "${userId}"
                ) 
            }
        `
      };
      const response = await post(data);
      return response.data.updateUserSettings;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  return {
    getAccountSettings,
    getUserSettings,
    updateAccountSettings,
    updateUserSettings
  };
};

export default useSettignsService;
