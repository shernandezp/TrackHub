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

const REQUEST_TIMEOUT_MS = 30000;

// Module-level mutex for token refresh to prevent concurrent refresh calls
let refreshPromise = null;

const createGraphQLError = (payload) => {
  const error = new Error('GraphQL response contains errors');
  error.response = { data: payload };
  return error;
};

const ensureNoGraphQLErrors = (payload) => {
  if (payload && Array.isArray(payload.errors) && payload.errors.length > 0) {
    throw createGraphQLError(payload);
  }
  return payload;
};

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
      return !(decoded.exp < currentTime);
    } catch {
      return false;
    }
  };

  /**
   * Acquires a valid token, using a mutex to prevent concurrent refresh calls.
   * @returns {Promise<string>} - A promise that resolves to a valid access token.
   */
  const acquireToken = async () => {
    if (isTokenValid(accessToken)) {
      return accessToken;
    }

    if (refreshPromise) {
      return refreshPromise;
    }

    refreshPromise = handleRefreshToken().finally(() => {
      refreshPromise = null;
    });

    return refreshPromise;
  };

  /**
   * Makes a POST request to the API endpoint.
   * @param {object} data - The data to send in the request body.
   * @returns {Promise<object>} - A promise that resolves to the response data.
   */
  const post = async (data) => {
    const token = await acquireToken();
    
    const response = await axios.post(endpoint, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      timeout: REQUEST_TIMEOUT_MS
    });
    return ensureNoGraphQLErrors(response.data);
  };

  /**
   * Makes a POST request to the API endpoint and downloads the file.
   * @param {object} data - The data to send in the request body.
   * @param {string} filename - The name of the file to download.
   * @returns {Promise<object>} - A promise that resolves to the response data.
   */
  const postFile = async (data, filename) => {
    const token = await acquireToken();
  
    const response = await axios.post(endpoint, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      responseType: 'blob',
      timeout: REQUEST_TIMEOUT_MS
    });
  
    const url = window.URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return { 
    post, 
    postFile 
  };
};

export default useApiService;
