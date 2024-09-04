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

  return {
    getRoles,
    getResourcesByRole
  };
};

export default useRoleService;
