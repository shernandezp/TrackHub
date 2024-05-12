import React, { createContext, useContext, useState } from "react";
import {generateCodeChallenge} from "utils/authutils";

import PropTypes from 'prop-types';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to consume the authentication context
export const useAuth = () => useContext(AuthContext);

// Authentication provider component
export const AuthProvider = ({ children, navigate }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = () => {
    const codeChallenge = generateCodeChallenge('dce35c1f-194d-48c4-bd90-6f14e9042023');
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

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, login }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
    navigate: PropTypes.func.isRequired
  };