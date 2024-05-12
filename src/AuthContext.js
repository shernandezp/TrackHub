import React, { createContext, useContext, useState, useRef } from "react";
import { generateCodeVerifier, generateCodeChallenge } from "utils/authutils";
import { refreshAccessToken } from "services/api";

import PropTypes from 'prop-types';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to consume the authentication context
export const useAuth = () => useContext(AuthContext);

// Authentication provider component
export const AuthProvider = ({ children, navigate }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const codeVerifierRef = useRef();

  const login = () => {
    if (!codeVerifierRef.current) {
      codeVerifierRef.current = generateCodeVerifier();
      sessionStorage.setItem('code_verifier', codeVerifierRef.current);
    }
    const codeChallenge = generateCodeChallenge(codeVerifierRef.current);
    const authorizationEndpoint = "https://localhost/Identity/authorize";
    const redirectUri = "http://localhost:3000/authentication/callback";
    const clientId = "web_client";
    const responseType = "code";
    const scope = "web_scope offline_access";
    const state = "123";

    const queryParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: responseType,
      scope: scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    });
    const authorizationUrl = `${authorizationEndpoint}?${queryParams.toString()}`;
    navigate(`/authentication/authorize?authorizationUrl=${encodeURIComponent(authorizationUrl)}`);
  };

  const handleApiError = async (error) => {
    if (error.response.status === 401) { // Unauthorized
      try {
        const data = await refreshAccessToken(refreshToken);
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
      } catch (refreshError) {
        // Refresh token is also expired or invalid, redirect to login page
        login();
      }
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, login, setAccessToken, setRefreshToken, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
    navigate: PropTypes.func.isRequired
  };