/**
* Copyright (c) 2024 Sergio Hernandez. All rights reserved.
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
 * A service for managing policies and resources.
 * @returns {Object} An object containing functions for interacting with policies and resources.
 */
const usePolicyService = () => {
  const { post } = useApiService(process.env.REACT_APP_SECURITY_ENDPOINT);
  /**
   * Retrieves all policies.
   * @returns {Promise<Array<Object>>} A promise that resolves to an array of policies.
   */
  const getPolicies = async () => {
    try {
      const data = {
        query: `
          query {
            policies {
              name
              policyId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.policies;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves resources associated with a specific policy.
   * @param {string} policyId - The ID of the policy.
   * @returns {Promise<Object>} A promise that resolves to an object containing the policy and its associated resources.
   */
  const getResourcesByPolicy = async (policyId) => {
    try {
      const data = {
        query: `
          query {
            resourcesByPolicy(query: { policyId: ${policyId} }) {
              name
              policyId
              resources {
                resourceId
                resourceName
                actions {
                  resourceId
                  actionName
                  actionId
                }
              }
            }
          }
        `
      };
      const response = await post(data);
      return response.data.resourcesByPolicy;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Retrieves users associated with a specific policy.
   * @param {string} policyId - The ID of the policy.
   * @returns {Promise<Object>} A promise that resolves to an object containing associated users to the policy.
   */
  const getUsersByPolicy = async (policyId) => {
    try {
      const data = {
        query: `
          query {
            usersByPolicy(query: { policyId: ${policyId} }) {
              firstName
              lastName
              username
              userId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.usersByPolicy;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Creates a resource action policy.
   * @param {string} resourceId - The ID of the resource.
   * @param {string} actionId - The ID of the action.
   * @param {string} policyId - The ID of the policy.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the resource action policy was created successfully.
   */
  const createResourceActionPolicy = async (resourceId, actionId, policyId) => {
    try {
      const data = {
        query: `
          mutation {
            createResourceActionPolicy(
              command: { resourceActionPolicy: 
                { 
                  policyId: ${policyId}, 
                  actionId: ${actionId}, 
                  resourceId: ${resourceId} 
                } 
              }
            ) {
              policyId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createResourceActionPolicy.policyId == policyId;
    } catch (error) {
      handleSilentError(error);
      return false;
    }
  };

  /**
   * Deletes a resource action policy.
   * @param {string} resourceId - The ID of the resource.
   * @param {string} actionId - The ID of the action.
   * @param {string} policyId - The ID of the policy.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the resource action policy was deleted successfully.
   */
  const deleteResourceActionPolicy = async (resourceId, actionId, policyId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteResourceActionPolicy(resourceId: ${resourceId}, actionId: ${actionId}, policyId: ${policyId})
          }
        `
      };
      const response = await post(data);
      return response.data.deleteResourceActionPolicy == policyId;
    } catch (error) {
      handleSilentError(error);
      return false;
    }
  };

  /**
   * Creates a user policy relation.
   * @param {string} userId - The ID of the user.
   * @param {string} policyId - The ID of the policy.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the user policy was created successfully.
   */
  const createUserPolicy = async (userId, policyId) => {
    try {
      const data = {
        query: `
          mutation {
            createUserPolicy(command: { userPolicy: 
              { 
                userId: "${userId}", 
                policyId: ${policyId}
              } 
            }) {
              userId
              policyId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.createUserPolicy;
    } catch (error) {
      handleError(error);
    }
  };

  /**
   * Deletes a user policy relation.
   * @param {string} userId - The ID of the user.
   * @param {string} policyId - The ID of the policy.
   * @returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the user policy was deleted successfully.
   */
  const deleteUserPolicy = async (userId, policyId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteUserPolicy(policyId: ${policyId}, userId: "${userId}")
          }
        `
      };
      const response = await post(data);
      return response.data.deleteUserPolicy;
    } catch (error) {
      handleSilentError(error);
    }
  };

  return {
    getPolicies,
    getResourcesByPolicy,
    getUsersByPolicy,
    createResourceActionPolicy,
    deleteResourceActionPolicy,
    createUserPolicy,
    deleteUserPolicy
  };
};

export default usePolicyService;
