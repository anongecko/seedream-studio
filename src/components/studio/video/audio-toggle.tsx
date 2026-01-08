'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

interface AudioToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  className?: string;
}

export function AudioToggle({ enabled, onChange, className = '' }: AudioToggleProps) {
  // Keyboard navigation helper
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!enabled);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-teal-500/5">
            {enabled ? (
              <Volume2 className="w-5 h-5 text-green-500" />
            ) : (
              <VolumeX className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold">Audio Generation</h3>
            <p className="text-xs text-muted-foreground">
              Add synchronized audio to video
            </p>
          </div>
        </div>

        {/* Toggle button */}
        <motion.button
          onClick={() => onChange(!enabled)}
          onKeyDown={handleKeyDown}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full rounded-xl border-2 p-4 transition-all ${
            enabled
              ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-teal-500/5 shadow-md'
              : 'border-border hover:border-green-500/30 bg-card'
          }`}
          role="switch"
          aria-checked={enabled}
          aria-label="Audio generation toggle"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Animated toggle switch */}
              <div
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  enabled ? 'bg-green-500' : 'bg-muted'
                }`}
              >
                <motion.div
                  initial={false}
                  animate={{
                    x: enabled ? 20 : 2,
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm"
                />
              </div>

              <div className="text-left">
                <div className={`text-sm font-semibold ${enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {enabled ? 'Audio Enabled' : 'Audio Disabled'}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {enabled
                    ? 'Voice, sound effects, and background music'
                    : 'Silent video (no audio track)'}
                </div>
              </div>
            </div>

            {/* Status indicator */}
            <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              enabled
                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {enabled ? 'ON' : 'OFF'}
            </div>
          </div>
        </motion.button>

        {/* Info box */}
        {enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-lg bg-green-500/5 border border-green-500/20 p-3"
          >
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-green-600 dark:text-green-400">Audio generation:</span>{' '}
              The AI will analyze your prompt and automatically generate synchronized voice narration,
              sound effects, or background music that matches the video content.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
