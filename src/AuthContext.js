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

  const codeChallenge = generateCodeChallenge('dce35c1f-194d-48c4-bd90-6f14e9042023');

  const login = () => {
    // Redirect to authority server for authentication
    window.location.href = "https://localhost/Identity/authorize" +
      "?client_id=web_client" +
      "&redirect_uri=http://localhost:3000/authentication/callback" +
      "&response_type=code" +
      "&scope=web_scope offline_access" +
      "&state=123" +
      `&code_challenge=${codeChallenge}` +
      "&code_challenge_method=S256";
  };

  const handleLoginCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    // Handle code exchange with your authorization server to obtain access token
    // This part is usually handled on your backend server
    // After obtaining the access token, set isAuthenticated to true
    setIsAuthenticated(true);

    // Redirect to the dashboard or desired route after successful authentication
    navigate("/dashboard");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, handleLoginCallback }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
    navigate: PropTypes.func.isRequired
  };