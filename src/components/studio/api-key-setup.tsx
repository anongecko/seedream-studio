'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ApiKeySetupProps {
  apiKey: string; // Passed from parent for controlled component
  onApiKeyChange: (key: string) => void; // Callback to parent
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

export function ApiKeySetup({ apiKey, onApiKeyChange, className = '' }: ApiKeySetupProps) {
  const [localKey, setLocalKey] = React.useState(apiKey);
  const [isVisible, setIsVisible] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

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
                    Get your BytePlus Seedream API key from{' '}
                    <a
                      href="https://console.byteplus.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ocean-500 hover:underline font-medium"
                    >
                      console.byteplus.com
                    </a>
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
