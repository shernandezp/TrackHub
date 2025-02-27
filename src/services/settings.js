/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/


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
                accountSettingsByUser 
                {
                  accountId,
                  maps,
                  mapsKey,
                  onlineInterval,
                  storeLastPosition,
                  storingInterval,
                  refreshMap,
                  refreshMapInterval
                }
            }
        `
      };
      const response = await post(data);
      return response.data.accountSettingsByUser;
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
                      accountId: "${accountSettingsData.accountId}" ,
                      maps: ${formatValue(accountSettingsData.maps)},
                      mapsKey: ${formatValue(accountSettingsData.mapsKey)},
                      onlineInterval: ${accountSettingsData.onlineInterval},
                      storeLastPosition: ${accountSettingsData.storeLastPosition},
                      storingInterval: ${accountSettingsData.storingInterval},
                      refreshMap: ${accountSettingsData.refreshMap},
                      refreshMapInterval: ${accountSettingsData.refreshMapInterval}
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
