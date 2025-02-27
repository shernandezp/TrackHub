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

import useApiService from './apiService';
import { handleError, handleSilentError } from 'utils/errorHandler';

/**
 * A service for managing roles and resources.
 * @returns {Object} An object containing functions for interacting with roles and resources.
 */
const useRoleService = () => {
  const { post } = useApiService(process.env.REACT_APP_SECURITY_ENDPOINT);

  /**
   * Retrieves all roles.
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of roles.
   */
  const getRoles = async () => {
    try {
      const data = {
        query: `
            query {
                roles {
                    name
                    roleId
                }
            }
        `
      };
      const response = await post(data);
      return response.data.roles;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves resources associated with a specific role.
   * @param {number} roleId - The ID of the role.
   * @returns {Promise<Object>} A promise that resolves to the resources associated with the role.
   */
  const getResourcesByRole = async (roleId) => {
    try {
      const data = {
        query: `
            query {
                resourcesByRole(query: { roleId: ${roleId} }) {
                    name
                    roleId
                    resources {
                        resourceId
                        resourceName
                        actions {
                            actionId
                            actionName
                            resourceId
                        }
                    }
                }
            }
        `
      };
      const response = await post(data);
      return response.data.resourcesByRole;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves users associated with a specific role.
   * @param {number} roleId - The ID of the role.
   * @returns {Promise<Object>} A promise that resolves the users associated to the role.
   */
  const getUsersByRole = async (roleId) => {
    try {
      const data = {
        query: `
          query {
            usersByRole(query: { roleId: ${roleId} }) {
              emailAddress
              firstName
              lastName
              userId
              username
            }
          }
        `
      };
      const response = await post(data);
      return response.data.usersByRole;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Creates a resource-action-role association.
   * @param {number} resourceId - The ID of the resource.
   * @param {number} actionId - The ID of the action.
   * @param {number} roleId - The ID of the role.
   * @returns {Promise<boolean>} A promise that resolves to true if the association is created successfully, false otherwise.
   */
  const createResourceActionRole = async (resourceId, actionId, roleId) => {
    try {
      const data = {
        query: `
          mutation {
            createResourceActionRole(
              command: { 
                resourceActionRole: 
                { 
                  roleId: ${roleId}, 
                  resourceId: ${resourceId}, 
                  actionId: ${actionId}, 
                } 
              }) 
              {
                roleId
              }
            }
        `
      };
      const response = await post(data);
      return response.data.createResourceActionRole.roleId == roleId;
    } catch (error) {
      handleSilentError(error);
      return false;
    }
  };

  /**
   * Deletes a resource-action-role association.
   * @param {number} resourceId - The ID of the resource.
   * @param {number} actionId - The ID of the action.
   * @param {number} roleId - The ID of the role.
   * @returns {Promise<boolean>} A promise that resolves to true if the association is deleted successfully, false otherwise.
   */
  const deleteResourceActionRole = async (resourceId, actionId, roleId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteResourceActionRole(resourceId: ${resourceId}, actionId: ${actionId}, roleId: ${roleId})
          }
        `
      };
      const response = await post(data);
      return response.data.deleteResourceActionRole == roleId;
    } catch (error) {
      handleSilentError(error);
      return false;
    }
  };

  /**
   * Creates a user-role association.
   * @param {number} userId - The ID of the user.
   * @param {number} roleId - The ID of the role.
   * @returns {Promise<boolean>} A promise that resolves to true if the association is created successfully.
   */
  const createUserRole = async (userId, roleId) => {
    try {
      const data = {
        query: `
          mutation {
            createUserRole(command: { userRole: 
              { 
                userId: "${userId}", 
                roleId: ${roleId}
              } 
            }) 
            {
              userId
              roleId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createUserRole;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Deletes a user-role association.
   * @param {number} userId - The ID of the user.
   * @param {number} roleId - The ID of the role.
   * @returns {Promise<boolean>} A promise that resolves to true if the association is deleted successfully.
   */
  const deleteUserRole = async (userId, roleId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteUserRole(roleId: ${roleId}, userId: "${userId}")
          }
        `
      };
      const response = await post(data);
      return response.data.deleteUserRole;
    } catch (error) {
      handleSilentError(error);
    }
  };

  return {
    getRoles,
    getResourcesByRole,
    getUsersByRole,
    createResourceActionRole,
    deleteResourceActionRole,
    createUserRole,
    deleteUserRole
  };
};

export default useRoleService;
