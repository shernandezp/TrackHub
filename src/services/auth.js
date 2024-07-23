import axios from 'axios';

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

  export async function revokeAccessToken(accessToken) {
    const revokeBody = new URLSearchParams({
      token: accessToken,
      client_id: process.env.REACT_APP_CLIENT_ID,
    });

    try {
      console.log(`Token: ${accessToken}`);
      console.log(`Refresh Token: ${refreshToken}`);
      await axios.post(process.env.REACT_APP_REVOKE_TOKEN_ENDPOINT, revokeBody.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(response => {
        console.log(response);
      });
    } catch (error) {
      console.error('Error revoking token:', error.message);
    }
  }

  export async function logout() {
    try {
        const response = await axios.post(process.env.REACT_APP_LOGOUT_ENDPOINT, {}, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log(response);
    } catch (error) {
        console.error('Error during logout:', error.message);
    }
}