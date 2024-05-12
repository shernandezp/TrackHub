import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { exchangeAuthorizationCode } from "services/api";
import { useAuth } from "AuthContext";

const CallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsAuthenticated, setAccessToken, setRefreshToken } = useAuth();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const authorizationCode = searchParams.get("code");

    if (authorizationCode) {
      // Exchange authorization code for access token
      exchangeAuthorizationCode(authorizationCode).then((data) => {
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setIsAuthenticated(true);
        // Redirect to dashboard
        navigate("/dashboard");
      })
      .catch((error) => {
        console.error("Error exchanging authorization code:", error);
        navigate("/error");
      });
    } else {
      // Handle error or unauthorized access
      navigate("/error");
    }
  }, [location.search, navigate]);

  return (
    <div>
      <p>Redirecting...</p>
    </div>
  );
};

export default CallbackPage;