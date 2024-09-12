/**
 * @module useGroupService
 * @description A custom hook for managing groups in the application.
 * @returns {Object} An object containing various functions for interacting with groups.
 */
import useApiService from './apiService';
import { formatValue } from 'utils/dataUtils';
import { handleError, handleSilentError } from 'utils/errorHandler';

/**
 * A custom hook for managing groups in the application.
 * @returns {Object} An object containing various functions for interacting with groups.
 */
const useGroupService = () => {
  const { post } = useApiService(process.env.REACT_APP_MANAGER_ENDPOINT);

  /**
   * Retrieves all groups.
   * @returns {Array} An array of group objects.
   */
  const getGroups = async () => {
    try {
      const data = {
        query: `
          query {
            groupsByAccount {
              accountId
              active
              description
              groupId
              name
            }
          }
        `
      };
      const response = await post(data);
      return response.data.groupsByAccount;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Creates a new group.
   * @param {Object} groupData - The data of the group to be created.
   * @returns {boolean} A boolean indicating whether the group was created successfully.
   */
  const createGroup = async (groupData) => {
    try {
      const data = {
        query: `
          mutation {
            createGroup(command: { group: 
              { 
                active: ${groupData.active}, 
                description: ${formatValue(groupData.description)}, 
                name: ${formatValue(groupData.name)}
              } 
            }) {
              accountId
              active
              description
              groupId
              name
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createGroup;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Updates an existing group.
   * @param {string} groupId - The ID of the group to be updated.
   * @param {Object} groupData - The updated data of the group.
   * @returns {boolean} A boolean indicating whether the group was updated successfully.
   */
  const updateGroup = async (groupId, groupData) => {
    try {
      const data = {
        query: `
          mutation {
            updateGroup(
              id: ${groupId},
              command: { group: 
                { 
                  name: ${formatValue(groupData.name)}, 
                  groupId: ${groupData.groupId}, 
                  description: ${formatValue(groupData.description)}, 
                  active: ${groupData.active} 
                } 
              }
            ) 
          }
        `
      };
      const response = await post(data);
      return response.data.updateGroup;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  /**
   * Deletes a group.
   * @param {string} groupId - The ID of the group to be deleted.
   * @returns {boolean} A boolean indicating whether the group was deleted successfully.
   */
  const deleteGroup = async (groupId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteGroup(id: ${groupId})
          }
        `
      };
      const response = await post(data);
      return response.data.deleteGroup;
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  /**
   * Retrieves all users in a specific group.
   * @param {string} groupId - The ID of the group.
   * @returns {Array} An array of user objects.
   */
  const getUsersByGroup = async (groupId) => {
    try {
      const data = {
        query: `
          query {
            usersByGroup(query: { groupId: ${groupId} }) {
              username
              userId
              active
              accountId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.usersByGroup;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Creates a user-group relationship.
   * @param {string} userId - The ID of the user.
   * @param {string} groupId - The ID of the group.
   * @returns {boolean} A boolean indicating whether the user-group relationship was created successfully.
   */
  const createUserGroup = async (userId, groupId) => {
    try {
      const data = {
        query: `
          mutation {
            createUserGroup(command: { userGroup: 
              { 
                userId: "${userId}", 
                groupId: ${groupId} 
              } 
            }) {
              userId
              groupId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createUserGroup;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Deletes a user-group relationship.
   * @param {string} userId - The ID of the user.
   * @param {string} groupId - The ID of the group.
   * @returns {boolean} A boolean indicating whether the user-group relationship was deleted successfully.
   */
  const deleteUserGroup = async (userId, groupId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteUserGroup(groupId: ${groupId}, userId: "${userId}")
          }
        `
      };
      const response = await post(data);
      return response.data.deleteUserGroup;
    } catch (error) {
      handleSilentError(error);
    }
  };

  /**
   * Creates a transporter-group relationship.
   * @param {string} transporterId - The ID of the transporter.
   * @param {string} groupId - The ID of the group.
   * @returns {boolean} A boolean indicating whether the transporter-group relationship was created successfully.
   */
  const createTransporterGroup = async (transporterId, groupId) => {
    try {
      const data = {
        query: `
          mutation {
            createTransporterGroup(
              command: { transporterGroup: 
                { 
                  transporterId: "${transporterId}", 
                  groupId: ${groupId}
                } 
              }
            ) {
              transporterId
              groupId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createTransporterGroup;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Deletes a transporter-group relationship.
   * @param {string} transporterId - The ID of the transporter.
   * @param {string} groupId - The ID of the group.
   * @returns {boolean} A boolean indicating whether the transporter-group relationship was deleted successfully.
   */
  const deleteTransporterGroup = async (transporterId, groupId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteTransporterGroup(groupId: ${groupId}, transporterId: "${transporterId}") 
          }
        `
      };
      const response = await post(data);
      return response.data.deleteTransporterGroup;
    } catch (error) {
      handleSilentError(error);
    }
  };

  return {
    getGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    getUsersByGroup,
    createUserGroup,
    deleteUserGroup,
    createTransporterGroup,
    deleteTransporterGroup
  };
};

export default useGroupService;
