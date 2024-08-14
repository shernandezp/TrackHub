import React from 'react';

// Create a new context
export const LoadingContext = React.createContext({
  loading: false, // default value
  setLoading: () => {}, // default function
});