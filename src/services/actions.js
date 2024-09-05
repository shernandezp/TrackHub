import useApiService from './apiService';
import { handleError } from 'utils/errorHandler';

const useActionService = () => {
  const { post } = useApiService(process.env.REACT_APP_SECURITY_ENDPOINT);

  const getActions = async () => {
    try {
      const data = {
        query: `
          query {
            actions {
              actionId
              actionName
              resourceId
            }
          }
        `
      };
      const response = await post(data);
      return response.data.actions;
    } catch (error) {
      handleError(error);
    }
  };

  return {
    getActions
  };
};

export default useActionService;
