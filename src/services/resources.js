import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';

const useResourceService = () => {
  const { post } = useApiService(process.env.REACT_APP_SECURITY_ENDPOINT);

  const getResources = async () => {
    try {
      const data = {
        query: `
          query {
            resources {
              resourceId
              resourceName
            }
          }
        `
      };
      const response = await post(data);
      return response.data.resources;
    } catch (error) {
      handleError(error);
    }
  };

  return {
    getResources
  };
};

export default useResourceService;
