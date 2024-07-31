import axios from 'axios';
import { useAuth } from '../AuthContext';
import { jwtDecode } from 'jwt-decode';

const useApiService = (endpoint) => {
  const { accessToken, handleRefreshToken } = useAuth();

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

  const post = async (data) => {
    if (!isTokenValid(accessToken)) {
      await handleRefreshToken();
    }
    try {
      const response = await axios.post(endpoint, data, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      return response.data;
    } catch (error) {
      console.error(error);
    }
  };

  return { post };
};

export default useApiService;
