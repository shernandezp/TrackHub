

export const exchangeAuthorizationCode = async (authorizationCode, codeVerifier) => {
    const requestBody = {
      grant_type: "authorization_code",
      code: authorizationCode,
      redirect_uri: "http://localhost:3000/authentication/callback",
      code_verifier: 'dce35c1f-194d-48c4-bd90-6f14e9042023', 
      client_id: "web_client"
    };
  
    try {
      const response = await fetch("https://localhost/Identity/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        throw new Error("Failed to exchange authorization code for access token");
      }
  
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error("Error exchanging authorization code:", error.message);
      throw error;
    }
  };