import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { exchangeAuthorizationCode } from "services/api"; // Function to exchange authorization code for access token
import { useAuth } from "AuthContext";

const CallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleLoginCallback, isAuthenticated } = useAuth();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const authorizationCode = searchParams.get("code");

    if (authorizationCode) {
      // Exchange authorization code for access token (typically done on the server-side)
      exchangeAuthorizationCode(authorizationCode).then((accessToken) => {
        // Store access token in local storage or state management
        localStorage.setItem("accessToken", accessToken);
        handleLoginCallback();
        // Redirect to dashboard or desired page
        navigate("/dashboard");
      })
      .catch((error) => {
        console.error("Error exchanging authorization code:", error);
        // Handle the error here, for example by navigating to an error page
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