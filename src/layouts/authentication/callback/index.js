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

import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { exchangeAuthorizationCode } from "services/auth";
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
    </div>
  );
};

export default CallbackPage;