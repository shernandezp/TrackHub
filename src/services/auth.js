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

/**
 * Exchanges the authorization code for an access token.
 * @param {string} authorizationCode - The authorization code to exchange.
 * @returns {Promise<object>} - A promise that resolves to the response data containing the access token.
 * @throws {Error} - If the exchange fails.
 */
export const exchangeAuthorizationCode = async (authorizationCode) => {
  const codeVerifier = sessionStorage.getItem('code_verifier');
  const requestBody = {
    grant_type: "authorization_code",
    code: authorizationCode,
    redirect_uri: process.env.REACT_APP_CALLBACK_ENDPOINT,
    code_verifier: codeVerifier, 
    client_id: process.env.REACT_APP_CLIENT_ID
  };

  try {
    const response = await axios.post(process.env.REACT_APP_TOKEN_ENDPOINT, requestBody, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response.status !== 200) {
      throw new Error("Failed to exchange authorization code for access token");
    }

    return await response.data;
  } catch (error) {
    console.error("Error exchanging authorization code:", error.message);
    throw error;
  }
};

/**
 * Refreshes the access token using the refresh token.
 * @param {string} refreshToken - The refresh token to use for refreshing the access token.
 * @returns {Promise<object>} - A promise that resolves to the response data containing the new access token.
 * @throws {Error} - If the refresh fails.
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const response = await axios.post(process.env.REACT_APP_TOKEN_ENDPOINT, new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.REACT_APP_CLIENT_ID,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    return response.data;
  } catch (error) {
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Revokes the access token.
 * @param {string} accessToken - The access token to revoke.
 * @throws {Error} - If the revocation fails.
 */
export async function revokeAccessToken(accessToken) {
  const revokeBody = new URLSearchParams({
    token: accessToken,
    client_id: process.env.REACT_APP_CLIENT_ID,
  });

  try {
    await axios.post(process.env.REACT_APP_REVOKE_TOKEN_ENDPOINT, revokeBody.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(response => {
      console.log('Revoking token', response);
    });
  } catch (error) {
    console.error('Error revoking token:', error.message);
  }
}

/**
 * Logs out the user.
 * @throws {Error} - If the logout fails.
 */
export async function logout() {
  try {
      const response = await axios.post(process.env.REACT_APP_LOGOUT_ENDPOINT, {}, {
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
          },
          withCredentials: true
      });
  } catch (error) {
      console.error('Error during logout:', error.message);
  }
}