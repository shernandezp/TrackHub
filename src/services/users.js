import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';
import { formatValue } from 'utils/dataUtils';

const useUserService = () => {
  const { post } = useApiService(process.env.REACT_APP_SECURITY_ENDPOINT);

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

  const updatePassword = async (userId, userData) => {
    try {
      const data = {
        query: `
          updatePassword(id: "${userId}", 
            command: { user: 
              { 
                userId: "${userData.userId}", 
                password: "${userData.password}" 
            } 
          })
        `
      };
      const response = await post(data);
      return response.data.updatePassword;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

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
