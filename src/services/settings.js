import useApiService from './apiService';
import { handleError, handleSilentError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

const useSettignsService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

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
