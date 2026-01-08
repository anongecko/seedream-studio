'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Clock, Sparkles } from 'lucide-react';
import type { VideoDuration } from '@/types/video-api';
import { DURATION_OPTIONS } from '@/constants/video-parameters';

interface DurationSelectorProps {
  value: VideoDuration;
  onChange: (value: VideoDuration) => void;
}

export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  // Group durations: Auto, Short (4-6s), Medium (8s), Long (10-12s)
  const autoOption = DURATION_OPTIONS[0]; // Auto (-1)
  const shortDurations = DURATION_OPTIONS.slice(1, 4); // 4, 5, 6
  const mediumDuration = DURATION_OPTIONS[4]; // 8
  const longDurations = DURATION_OPTIONS.slice(5); // 10, 12

  // Keyboard navigation helper
  const handleKeyDown = (e: React.KeyboardEvent, targetValue: VideoDuration) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(targetValue);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <Clock className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Duration</h3>
          <p className="text-xs text-muted-foreground">
            Video length in seconds
          </p>
        </div>
      </div>

      {/* Auto option - featured */}
      <motion.button
        onClick={() => onChange(-1)}
        onKeyDown={(e) => handleKeyDown(e, -1)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full rounded-xl border-2 p-4 transition-all ${
          value === -1
            ? 'border-purple-500 bg-gradient-to-br from-purple-500/10 to-purple-500/5 shadow-lg shadow-purple-500/20'
            : 'border-border hover:border-purple-500/30 bg-card'
        }`}
        aria-label="Auto duration (recommended)"
        aria-pressed={value === -1}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className={`w-5 h-5 ${value === -1 ? 'text-purple-500' : 'text-muted-foreground'}`} />
            <div className="text-left">
              <div className={`text-sm font-semibold ${value === -1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Auto Duration (Recommended)
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Model decides optimal length (4-12s)
              </div>
            </div>
          </div>
          {value === -1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
            >
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          )}
        </div>
      </motion.button>

      {/* Fixed durations */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Or choose a fixed duration:</p>

        {/* Short durations (4-6s) */}
        <div className="grid grid-cols-3 gap-2">
          {shortDurations.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, option.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                value === option.value
                  ? 'border-ocean-500 bg-gradient-to-br from-ocean-500 to-dream-500 text-white shadow-lg'
                  : 'border-border hover:border-ocean-500/30 bg-card text-muted-foreground hover:text-foreground'
              }`}
              aria-label={`${option.value} seconds duration`}
              aria-pressed={value === option.value}
            >
              {option.value}s
            </motion.button>
          ))}
        </div>

        {/* Medium duration (8s) */}
        <motion.button
          onClick={() => onChange(mediumDuration.value)}
          onKeyDown={(e) => handleKeyDown(e, mediumDuration.value)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
            value === mediumDuration.value
              ? 'border-ocean-500 bg-gradient-to-br from-ocean-500 to-dream-500 text-white shadow-lg'
              : 'border-border hover:border-ocean-500/30 bg-card text-muted-foreground hover:text-foreground'
          }`}
          aria-label="8 seconds duration (standard)"
          aria-pressed={value === mediumDuration.value}
        >
          {mediumDuration.value}s (Standard)
        </motion.button>

        {/* Long durations (10-12s) */}
        <div className="grid grid-cols-2 gap-2">
          {longDurations.map((option) => (
            <motion.button
              key={option.value}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, option.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                value === option.value
                  ? 'border-ocean-500 bg-gradient-to-br from-ocean-500 to-dream-500 text-white shadow-lg'
                  : 'border-border hover:border-ocean-500/30 bg-card text-muted-foreground hover:text-foreground'
              }`}
              aria-label={`${option.value} seconds duration`}
              aria-pressed={value === option.value}
            >
              {option.value}s
            </motion.button>
          ))}
        </div>
      </div>

      {/* Helper text */}
      <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
        <p className="text-xs text-muted-foreground">
          {value === -1 ? (
            <>
              <span className="font-medium text-purple-600 dark:text-purple-400">Auto mode:</span>{' '}
              The AI will choose the best duration based on your prompt content.
              <span className="block mt-1 text-[10px]">
                ⚠️ Note: Duration affects billing. Longer videos cost more tokens.
              </span>
            </>
          ) : (
            <>
              <span className="font-medium text-ocean-600 dark:text-ocean-400">Fixed {value}s:</span>{' '}
              Video will be exactly {value} seconds long.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
