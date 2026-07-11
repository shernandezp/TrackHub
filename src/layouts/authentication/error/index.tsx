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

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "AuthContext";

// @mui material components
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import Alert from "@mui/material/Alert";

// Argon Dashboard 2 MUI components (vendored, untyped) — type the prop slice
// crossing the boundary.
import ArgonBoxBase from "components/ArgonBox";
import ArgonTypographyBase from "components/ArgonTypography";
import ArgonButtonBase from "components/ArgonButton";

interface ArgonBoxProps {
  minHeight?: string;
  p?: number;
  pl?: number;
  mb?: number;
  mt?: number;
  display?: string;
  gap?: number;
  justifyContent?: string;
  textAlign?: string;
  component?: string;
  sx?: object;
  children?: ReactNode;
}
const ArgonBox = ArgonBoxBase as unknown as (props: ArgonBoxProps) => ReactNode;

interface ArgonTypographyProps {
  variant?: string;
  fontWeight?: string;
  color?: string;
  children?: ReactNode;
}
const ArgonTypography = ArgonTypographyBase as unknown as (props: ArgonTypographyProps) => ReactNode;

interface ArgonButtonProps {
  variant?: string;
  color?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: ReactNode;
}
const ArgonButton = ArgonButtonBase as unknown as (props: ArgonButtonProps) => ReactNode;

const ErrorPage = () => {
  const navigate = useNavigate();
  const { resetAuthError, login } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const [canRetry, setCanRetry] = useState(false);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    // Get the specific error from session storage
    const authError = sessionStorage.getItem('auth_error');
    
    // If no error exists, redirect to dashboard (user shouldn't be on this page)
    if (!authError) {
      navigate('/dashboard', { replace: true });
      return;
    }
    
    switch(authError) {
      case 'token_exchange_failed':
        setErrorMessage("Failed to exchange authorization code for access token. The authentication service may be unavailable.");
        break;
      case 'no_code':
        setErrorMessage("No authorization code was received. The authentication process was interrupted.");
        break;
      default:
        setErrorMessage(authError || "An authentication error occurred. Please try again later.");
    }

    // Start countdown for retry button
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanRetry(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRetry = () => {
    // Clear error states
    sessionStorage.removeItem('auth_error');
    resetAuthError();
    
    // Attempt login again
    login();
  };

  const handleGoBack = () => {
    sessionStorage.removeItem('auth_error');
    resetAuthError();
    navigate('/');
  };

  return (
    <ArgonBox
      minHeight="100vh"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(195deg, #42424a 0%, #191919 100%)",
      }}
    >
      <Container maxWidth="sm">
        <Card>
          <ArgonBox p={3} textAlign="center">
            <ArgonBox mb={2}>
              <ArgonTypography variant="h3" fontWeight="bold" color="error">
                Authentication Failed
              </ArgonTypography>
            </ArgonBox>
            
            <ArgonBox mb={3}>
              <Alert severity="error" sx={{ textAlign: "left" }}>
                {errorMessage}
              </Alert>
            </ArgonBox>

            <ArgonBox mb={2}>
              <ArgonTypography variant="body2" color="text">
                This could be due to:
              </ArgonTypography>
              <ArgonBox component="ul" textAlign="left" pl={4} mt={1}>
                <li>
                  <ArgonTypography variant="body2" color="text">
                    The authentication service is temporarily unavailable
                  </ArgonTypography>
                </li>
                <li>
                  <ArgonTypography variant="body2" color="text">
                    Network connectivity issues
                  </ArgonTypography>
                </li>
                <li>
                  <ArgonTypography variant="body2" color="text">
                    Invalid or expired authentication request
                  </ArgonTypography>
                </li>
              </ArgonBox>
            </ArgonBox>

            <ArgonBox mt={4} display="flex" gap={2} justifyContent="center">
              <ArgonButton
                variant="gradient"
                color="info"
                onClick={handleRetry}
                disabled={!canRetry}
              >
                {canRetry ? "Retry Authentication" : `Retry in ${countdown}s`}
              </ArgonButton>
              <ArgonButton
                variant="outlined"
                color="dark"
                onClick={handleGoBack}
              >
                Go Back
              </ArgonButton>
            </ArgonBox>

            {!canRetry && (
              <ArgonBox mt={2}>
                <ArgonTypography variant="caption" color="text">
                  Please wait before retrying to avoid overloading the authentication service.
                </ArgonTypography>
              </ArgonBox>
            )}
          </ArgonBox>
        </Card>
      </Container>
    </ArgonBox>
  );
};

export default ErrorPage;
