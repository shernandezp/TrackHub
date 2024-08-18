
import useApiService from './apiService';
import { handleSilentError } from 'utils/errorHandler';

/**
 * A custom hook for handling connectivity tests to operators.
 * @returns {Object} An object containing the testConnectivity function.
 */
const useConnectivityService = () => {
    const { post } = useApiService(process.env.REACT_APP_ROUTER_ENDPOINT);

    /**
     * Tests the connectivity with an operator.
     * @param {number} operatorId - The ID of the operator to test connectivity with.
     * @returns {boolean} A boolean indicating whether the connectivity test was successful.
     */
    const testConnectivity = async (operatorId) => {
        try {
            const data = {
                query: `
                    query {
                        pingOperator(query: { operatorId: "${operatorId}" }) 
                    }
                `
            };
            const response = await post(data);
            return response.data.pingOperator;
        } catch (error) {
            handleSilentError(error);
            return false;
        }
    };

    return {
        testConnectivity
    };
};

export default useConnectivityService;
