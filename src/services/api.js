import axios from 'axios';

  export const exchangeAuthorizationCode = async (authorizationCode) => {
    const codeVerifier = sessionStorage.getItem('code_verifier');
    const requestBody = {
      grant_type: "authorization_code",
      code: authorizationCode,
      redirect_uri: "http://localhost:3000/authentication/callback",
      code_verifier: codeVerifier, 
      client_id: "web_client"
    };
  
    try {
      const response = await axios.post("https://localhost/Identity/token", requestBody, {
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
      const response = await axios.post('https://localhost/Identity/token', new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: 'web_client',
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