'use client';

import { useState, useEffect } from 'react';

const API_KEY_STORAGE_KEY = 'seedream:apiKey';

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored) {
      setApiKeyState(stored);
    }
    setIsLoaded(true);
  }, []);

  // Save API key to localStorage and state
  const setApiKey = (key: string) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  };

  // Clear API key from localStorage and state
  const clearApiKey = () => {
    setApiKeyState('');
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  };

  // Check if API key is set
  const hasApiKey = apiKey.length > 0;

  return {
    apiKey,
    setApiKey,
    clearApiKey,
    hasApiKey,
    isLoaded,
  };
}
