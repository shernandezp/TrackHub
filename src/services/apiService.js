
import axios from 'axios';
import { useAuth } from '../AuthContext';
import { jwtDecode } from 'jwt-decode';

/**
 * Custom hook for making API requests.
 * @param {string} endpoint - The API endpoint to make requests to.
 * @returns {object} - An object containing the post function for making POST requests.
 */
const useApiService = (endpoint) => {
  const { accessToken, handleRefreshToken } = useAuth();

  /**
   * Checks if the access token is valid.
   * @param {string} token - The access token to check.
   * @returns {boolean} - True if the token is valid, false otherwise.
   */
  const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      // Check if the token has expired
      return !(decoded.exp < currentTime);
    } catch (error) {
      console.error('Error decoding token:', error);
      return false;
    }
  };

  /**
   * Makes a POST request to the API endpoint.
   * @param {object} data - The data to send in the request body.
   * @returns {Promise<object>} - A promise that resolves to the response data.
   */
  const post = async (data) => {
    let token = accessToken;
    if (!isTokenValid(accessToken)) {
      token = await handleRefreshToken();
    }
    
    const response = await axios.post(endpoint, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
    
  };

  return { post };
};

export default useApiService;
