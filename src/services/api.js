import axios from 'axios';

export const exchangeAuthorizationCode = async (authorizationCode) => {
    const requestBody = {
      grant_type: "authorization_code",
      code: authorizationCode,
      redirect_uri: "http://localhost:3000/authentication/callback",
      code_verifier: 'dce35c1f-194d-48c4-bd90-6f14e9042023', 
      client_id: "web_client"
    };
  
    try {
      const response = await axios.post("https://localhost:7158/token", requestBody, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      if (response.status !== 200) {
        throw new Error("Failed to exchange authorization code for access token");
      }

      const data = await response.data;
      return data.access_token;
    } catch (error) {
      console.error("Error exchanging authorization code:", error.message);
      throw error;
    }
  };