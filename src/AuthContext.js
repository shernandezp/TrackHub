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

import React, { createContext, useContext, useState, useRef } from "react";
import { generateCodeVerifier, generateCodeChallenge } from "utils/authutils";
import { refreshAccessToken, revokeAccessToken, logout } from "services/auth";

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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const codeVerifierRef = useRef();

  const login = () => {
    if (!isLoggingIn) {
      setIsLoggingIn(true);
      if (!codeVerifierRef.current) {
        codeVerifierRef.current = generateCodeVerifier();
        sessionStorage.setItem('code_verifier', codeVerifierRef.current);
      }
      const codeChallenge = generateCodeChallenge(codeVerifierRef.current);
      const responseType = "code";
      const scope = "web_scope offline_access";
      const state = "123";

      const queryParams = new URLSearchParams({
        client_id: process.env.REACT_APP_CLIENT_ID,
        redirect_uri: process.env.REACT_APP_CALLBACK_ENDPOINT,
        response_type: responseType,
        scope: scope,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256"
      });
      const authorizationUrl = `${process.env.REACT_APP_AUTHORIZATION_ENDPOINT}?${queryParams.toString()}`;
      navigate(`/authentication/authorize?authorizationUrl=${encodeURIComponent(authorizationUrl)}`);
    }
  };

  const logoff = async () => {
    await revokeAccessToken(accessToken, refreshToken);
    await logout();

    // Clear any stored tokens or user information
    setAccessToken('');
    setRefreshToken('');
  
    // Redirect to the login page
    login();
  };

  const handleRefreshToken = async () => {
    try {
      const data = await refreshAccessToken(refreshToken);
      setAccessToken(data.access_token);
      setRefreshToken(data.refresh_token);
      return data.access_token;
    } catch (refreshError) {
      // Refresh token is also expired or invalid, redirect to login page
      login();
    }
  };

  return (
    <AuthContext.Provider value={{ 
        isAuthenticated, 
        isLoggingIn,
        setIsAuthenticated, 
        login, 
        logoff, 
        accessToken,
        setAccessToken, 
        setRefreshToken,
        handleRefreshToken
      }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
    navigate: PropTypes.func.isRequired
  };