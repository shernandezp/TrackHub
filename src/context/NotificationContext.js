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

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import PropTypes from "prop-types";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

const AUTO_HIDE_DURATION = 6000;

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  const showError = useCallback((message) => {
    setNotification({ open: true, message, severity: "error" });
  }, []);

  const showSuccess = useCallback((message) => {
    setNotification({ open: true, message, severity: "success" });
  }, []);

  const showWarning = useCallback((message) => {
    setNotification({ open: true, message, severity: "warning" });
  }, []);

  const handleClose = useCallback((_, reason) => {
    if (reason === "clickaway") return;
    setNotification((prev) => ({ ...prev, open: false }));
  }, []);

  // Listen for custom error events dispatched from non-React code (e.g., errorHandler.js)
  useEffect(() => {
    const handler = (e) => showError(e.detail.message);
    window.addEventListener("app-error", handler);
    return () => window.removeEventListener("app-error", handler);
  }, [showError]);

  return (
    <NotificationContext.Provider value={{ showError, showSuccess, showWarning }}>
      {children}
      <Snackbar
        open={notification.open}
        autoHideDuration={AUTO_HIDE_DURATION}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleClose}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
