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
 * A module that provides functions for interacting with user data.
 * @module useUserService
 */
import useApiService from './apiService';
import { handleError, handleSilentError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

/**
 * Custom hook for user-related services.
 * @returns {Object} An object containing functions for user operations.
 */
const useUserService = () => {
  const { post } = useApiService(process.env.REACT_APP_SECURITY_ENDPOINT);

  /**
   * Retrieves a user by their ID.
   * @async
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Object>} A promise that resolves to the user object.
   */
  const getUser = async (userId) => {
    try {
      const data = {
        query: `
          query {
            user(query: { id: "${userId}" }) {
              username
              userId
              secondSurname
              secondName
              loginAttempts
              lastName
              firstName
              emailAddress
              dob
              accountId
              active
            }
          }
        `
      };
      const response = await post(data);
      return response.data.user;
    } catch (error) {
      handleError(error);
    }
  };

   /**
   * Retrieves the current user.
   * @async
   * @returns {Promise<Object>} A promise that resolves to the user object.
   */
   const getCurrentUser = async () => {
    try {
      const data = {
        query: `
          query {
            currentUser {
              username
              userId
              secondSurname
              secondName
              roles {
                name
                roleId
              }
              profiles {
                name
                policyId
              }
              loginAttempts
              lastName
              firstName
              emailAddress
              dob
              active
              accountId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.currentUser;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves all users associated with an account.
   * @async
   * @returns {Promise<Array>} A promise that resolves to an array of user objects.
   */
  const getUsersByAccount = async () => {
    try {
      const data = {
        query: `
          query {
            usersByAccount {
              accountId
              username
              userId
              secondSurname
              secondName
              loginAttempts
              lastName
              firstName
              emailAddress
              dob
              active
            }
          }
        `
      };
      const response = await post(data);
      return response.data.usersByAccount;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Creates a new user.
   * @async
   * @param {Object} userData - The data of the user to be created.
   * @returns {Promise<Object>} A promise that resolves to the created user object.
   */
  const createUser = async (userData) => {
    try {
      const data = {
        query: `
          mutation {
            createUser(
            command: {
              user: {
                username: ${formatValue(userData.username)}
                secondSurname: ${formatValue(userData.secondSurname)}
                secondName: ${formatValue(userData.secondName)}
                password: ${formatValue(userData.password)}
                lastName: ${formatValue(userData.lastName)}
                firstName: ${formatValue(userData.firstName)}
                emailAddress: ${formatValue(userData.emailAddress)}
                dob: ${formatValue(userData.dob)}
                active: ${userData.active ?? true}
              }
            }
            ) {
                username
                userId
                secondSurname
                secondName
                loginAttempts
                lastName
                firstName
                emailAddress
                dob
                accountId
                active
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createUser;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Creates a new manager.
   * @async
   * @param {Object} userData - The data of the manager to be created.
   * @param {string} accountId - The ID of the account to which the manager will be associated.
   * @returns {Promise<Object>} A promise that resolves to the created manager object.
   */
  const createManager = async (userData, accountId) => {
    try {
      const data = {
        query: `
          mutation {
            createManager(
              command: {
                accountId: "${accountId}"
                user: {
                  username: ${formatValue(userData.username)}
                  secondSurname: ${formatValue(userData.secondSurname)}
                  secondName: ${formatValue(userData.secondName)}
                  lastName: ${formatValue(userData.lastName)}
                  firstName: ${formatValue(userData.firstName)}
                  password: ${formatValue(userData.password)}
                  dob: ${formatValue(userData.dob)}
                  active: ${userData.active}
                  emailAddress: ${formatValue(userData.emailAddress)}
              }
            }) 
            {
              userId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createManager;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Updates an existing user.
   * @async
   * @param {string} userId - The ID of the user to be updated.
   * @param {Object} userData - The updated data of the user.
   * @returns {Promise<Object>} A promise that resolves to the updated user object.
   */
  const updateUser = async (userId, userData) => {
    try {
      const data = {
        query: `
          mutation {
            updateUser(
              command: {
                user: {
                  username: ${formatValue(userData.username)}
                  userId: ${formatValue(userData.userId)}
                  secondSurname: ${formatValue(userData.secondSurname)}
                  secondName: ${formatValue(userData.secondName)}
                  lastName: ${formatValue(userData.lastName)}
                  firstName: ${formatValue(userData.firstName)}
                  emailAddress: ${formatValue(userData.emailAddress)}
                  dob: ${formatValue(userData.dob)}
                  active: ${userData.active}
                }
              }
              id: "${userId}"
              ) 
            }
        `
      };
      const response = await post(data);
      return response.data.updateUser;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

    /**
   * Updates an existing user.
   * @async
   * @param {Object} userData - The updated data of the user.
   * @returns {Promise<Object>} A promise that resolves to the updated user object.
   */
    const updateCurrentUser = async (userData) => {
      try {
        const data = {
          query: `
            mutation {
              updateCurrentUser(
                command: {
                  user: {
                    secondSurname: ${formatValue(userData.secondSurname)}
                    secondName: ${formatValue(userData.secondName)}
                    lastName: ${formatValue(userData.lastName)}
                    firstName: ${formatValue(userData.firstName)}
                    dob: ${formatValue(userData.dob)}
                  }
                }
              )
            }
          `
        };
        const response = await post(data);
        return response.data.updateCurrentUser;
      } catch (error) {
        handleError(error);
        return false;
      }
    };

  /**
   * Updates the password of a user.
   * @async
   * @param {string} userId - The ID of the user whose password will be updated.
   * @param {Object} userData - The updated password data.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating the success of the password update.
   */
  const updatePassword = async (userId, userData) => {
    try {
      const data = {
        query: `
          mutation {
            updatePassword(command: { user: { userId: "${userData.userId}", password: "${userData.password}" } }, id: "${userId}")
          }
        `
      };
      const response = await post(data);
      return response.data.updatePassword;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  /**
   * Deletes a user.
   * @async
   * @param {string} userId - The ID of the user to be deleted.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating the success of the deletion.
   */
  const deleteUser = async (userId) => {
    try {
      const data = {
        query: `
            mutation {
                deleteUser(id: "${userId}")
            }
        `
      };
      const response = await post(data);
      return response.data.deleteUser;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  /**
   * Checks if the current user is an admin.
   * @async
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the user is an admin.
   * @returns {boolean} A boolean indicating if the user is an admin.
   */
  const isAdmin = async () => {
    try {
      const data = {
        query: `
          query {
            userIsAdmin
          }
        `
      };
      const response = await post(data);
      return response.data.userIsAdmin;
    } catch (error) {
      handleSilentError(error);
      return false;
    }
  };

  /**
   * Checks if the current user is a manager.
   * @async
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating if the user is a manager.
   * @returns {boolean} A boolean indicating if the user is a manager.
   */
  const isManager = async () => {
    try {
      const data = {
        query: `
          query {
            userIsManager
          }
        `
      };
      const response = await post(data);
      return response.data.userIsManager;
    } catch (error) {
      handleSilentError(error);
      return false;
    }
  };

  return {
    getUser,
    getCurrentUser,
    getUsersByAccount,
    createUser,
    createManager,
    updateUser,
    updateCurrentUser,
    updatePassword,
    deleteUser,
    isAdmin,
    isManager
  };
};

export default useUserService;
