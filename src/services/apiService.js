import axios from 'axios';
import { useContext } from 'react';
import useAuth from '../AuthContext';
import jwtDecode from 'jwt-decode';

export const apiService = (endpoint) => {
  const { accessToken, handleRefreshToken } = useContext(useAuth);

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
  }

  axios.interceptors.request.use(
    async (config) => {
        if (!accessToken || !isTokenValid(accessToken)) {
            await handleRefreshToken();
        }
      config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  const post = async (data) => {
    try {
      const response = await axios.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(error);
    }
  };

  return { post };
};