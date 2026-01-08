'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

import type { SeaDreamModel } from '@/types/api';

interface ApiKeySetupProps {
  apiKey: string; // Passed from parent for controlled component
  onApiKeyChange: (key: string) => void; // Callback to parent
  model?: SeaDreamModel;
  onVideoModelIdChange?: (modelId: string) => void; // Optional callback for custom video model ID
  className?: string;
}

/**
 * Validates API key format (basic check)
 * Real validation happens on first API call
 */
function validateApiKeyFormat(key: string): { isValid: boolean; message?: string } {
  if (!key || key.trim().length === 0) {
    return { isValid: false };
  }

  // Basic format check - should be alphanumeric with possible dashes/underscores
  // Typical API keys are at least 20 characters
  if (key.length < 20) {
    return { isValid: false, message: 'API key seems too short' };
  }

  // Check if it contains only valid characters
  if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
    return { isValid: false, message: 'API key contains invalid characters' };
  }

  return { isValid: true };
}

export function ApiKeySetup({
  apiKey,
  onApiKeyChange,
  model = 'seedream-4-5',
  onVideoModelIdChange,
  className = ''
}: ApiKeySetupProps) {
  const [localKey, setLocalKey] = React.useState(apiKey);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const [localVideoModelId, setLocalVideoModelId] = React.useState(''); // Custom video model ID

  // Sync local state with prop when it changes (e.g., loaded from localStorage)
  React.useEffect(() => {
    setLocalKey(apiKey);
  }, [apiKey]);

  const validation = validateApiKeyFormat(localKey);

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKey = e.target.value;
    setLocalKey(newKey);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Save to parent (which handles localStorage via hook)
    if (validation.isValid) {
      onApiKeyChange(localKey);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && validation.isValid) {
      e.currentTarget.blur();
    }
  };

  // Show setup card if no valid API key from parent
  const showSetupCard = !validateApiKeyFormat(apiKey).isValid;

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {showSetupCard ? (
          <motion.div
            key="setup-card"
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="rounded-xl border-2 border-ocean-500/30 bg-gradient-to-br from-ocean-500/10 via-background to-dream-500/10 p-6 shadow-lg"
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-ocean-500 to-dream-500">
                  <Key className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Enter your API Key</h3>
                  <p className="text-sm text-muted-foreground">
                    Get your BytePlus Seedream {model === 'seedream-4-0' ? '4.0' : '4.5'} API key from{' '}
                    <a
                      href="https://console.byteplus.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ocean-500 hover:underline font-medium"
                    >
                      BytePlus Console
                    </a>
                    .
                  </p>
                </div>

                {/* Input */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={isVisible ? 'text' : 'password'}
                      value={localKey}
                      onChange={handleKeyChange}
                      onFocus={() => setIsFocused(true)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full rounded-lg border border-input bg-background px-4 py-3 pr-24 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 transition-all"
                      autoComplete="off"
                      spellCheck={false}
                    />

                    {/* Toggle visibility */}
                    <button
                      type="button"
                      onClick={() => setIsVisible(!isVisible)}
                      className="absolute right-12 top-1/2 -translate-y-1/2 p-2 hover:bg-accent rounded-md transition-colors"
                      tabIndex={-1}
                    >
                      {isVisible ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>

                    {/* Status indicator */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <AnimatePresence mode="wait">
                        {localKey && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {validation.isValid ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-orange-500" />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Validation message */}
                  <AnimatePresence mode="wait">
                    {localKey && !validation.isValid && validation.message && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="text-xs text-orange-600 dark:text-orange-400"
                      >
                        {validation.message}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Optional: Custom video model ID */}
                  {model === 'seedance-1-5-pro' && (
                    <div className="space-y-1.5 pt-3 border-t border-border/50 mt-3">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016-6 0 3 3 0 01-6 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.518 7.163 9.336 9.153 11.514l-.322-.092-.504-.215-.666-.442l-.092-.21v-6.586a3 3 0 01-.367-.295c-.204-.3-.545-.407-.872-.544C7.28 2.778 6.267 2.628 5.07 2.815c-.846.338-1.737.467-2.616.557-.967.15-1.9.328-2.815.557-.75.22-1.534.417-2.31.587-.58.24-.815.557-1.22.962-.767.397-1.534.604-2.31.755-.45.33-.92.604-1.375.953-.26.735.45-1.44.95-2.185.567-.38.17-.77.42-1.17.614-.775.25-1.55.417-2.35.625-.384.29-.745.6-1.15.7-.832.16-1.686.435-2.55.58-.267.335-.63.573-1.01.768-1.377.405-.83.77-1.672.925-2.556.567-.285.762-.487 1.17-.615l3.05 3.05a1 1 0 001.41 0 016.971v2.753c0 1.823-.737 3.31-2.068 4.386l-3.05-3.05a1 1 0 00-.296-.716 0-1.705V14.95z" />
                        </svg>
                        Optional: Custom Video Model ID
                      </label>
                      <input
                        type="text"
                        value={localVideoModelId}
                        onChange={(e) => {
                          setLocalVideoModelId(e.target.value);
                          onVideoModelIdChange?.(e.target.value);
                        }}
                        placeholder="seedance-1-5-pro (default)"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 transition-all placeholder:text-muted-foreground/50"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <p className="text-[11px] text-muted-foreground/70">
                        Only change this if you get a "model does not exist" error. Your model ID may differ (e.g., seedance-1-5-pro-251215).
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Your API key is stored locally and never sent anywhere except BytePlus servers
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Compact indicator when key is set
          <motion.div
            key="key-set"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
          >
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">API Key Connected</p>
              <p className="text-xs text-muted-foreground truncate font-mono">
                {localKey.slice(0, 8)}...{localKey.slice(-8)}
              </p>
            </div>
            <button
              onClick={() => {
                onApiKeyChange(''); // Hook will handle localStorage
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Change
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
