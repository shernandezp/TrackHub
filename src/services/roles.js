import useApiService from './apiService';
import { handleError, handleSilentError } from 'utils/errorHandler';

const useRoleService = () => {
  const { post } = useApiService(process.env.REACT_APP_SECURITY_ENDPOINT);

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
                resourceId
                actionId
                resourceActionPolicyId
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

  return {
    getRoles,
    getResourcesByRole,
    createResourceActionRole,
    deleteResourceActionRole
  };
};

export default useRoleService;
