/**
* Copyright (c) 2025 Sergio Hernandez. All rights reserved.
*
*  Licensed under the Apache License, Version 2.0 (the "License").
*  You may not use this file except in compliance with the License.
*  You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
*  Unless required by applicable law or agreed to in writing, software
*  distributed under the License is distributed on an "AS IS" BASIS,
*  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
*  See the License for the specific language governing permissions and
*  limitations under the License.
*/


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
