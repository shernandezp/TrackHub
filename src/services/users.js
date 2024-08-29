/**
 * A module that provides functions for interacting with user data.
 * @module useUserService
 */
import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

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
                    password: ${formatValue(userData.password)}
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

  return {
    getUser,
    getUsersByAccount,
    createUser,
    updateUser,
    updatePassword,
    deleteUser,
  };
};

export default useUserService;
