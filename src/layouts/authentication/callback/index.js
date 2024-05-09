import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { exchangeAuthorizationCode } from "services/api"; // Function to exchange authorization code for access token

const CallbackPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const authorizationCode = searchParams.get("code");

    if (authorizationCode) {
      // Exchange authorization code for access token (typically done on the server-side)
      exchangeAuthorizationCode(authorizationCode).then((accessToken) => {
        // Store access token in local storage or state management
        localStorage.setItem("accessToken", accessToken);

        // Redirect to dashboard or desired page
        navigate("/dashboard");
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