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

  return {
    getPolicies,
    getResourcesByPolicy,
    createResourceActionPolicy,
    deleteResourceActionPolicy
  };
};

export default usePolicyService;