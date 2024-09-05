import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';

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

  const createResourceActionRole = async (resourceActionRoleData) => {
    try {
      const data = {
        query: `
          mutation {
            createResourceActionRole(
              command: { 
                resourceActionRole: 
                { 
                  roleId: ${resourceActionRoleData.roleId}, 
                  resourceId: ${resourceActionRoleData.resourceId}, 
                  actionId: ${resourceActionRoleData.actionId}, 
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
      return response.data.createResourceActionRole;
    } catch (error) {
      handleError(error);
    }
  };

  const deleteResourceActionRole = async (resourceActionRoleId) => {
    try {
      const data = {
        query: `
          mutation {
            deleteResourceActionRole(resourceActionRoleId: ${resourceActionRoleId})
          }
        `
      };
      const response = await post(data);
      return response.data.createResourceActionRole;
    } catch (error) {
      handleError(error);
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
