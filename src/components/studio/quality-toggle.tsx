'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';
import type { Quality } from '@/types/api';

interface QualityToggleProps {
  value: Quality;
  onChange: (value: Quality) => void;
  className?: string;
}

const QUALITY_OPTIONS = [
  {
    value: 'standard' as const,
    label: 'Standard',
    description: 'Higher quality',
    time: '~15-20s',
    icon: Clock,
  },
  {
    value: 'fast' as const,
    label: 'Fast',
    description: 'Quick generation',
    time: '~8-12s',
    icon: Zap,
  },
];

export function QualityToggle({ value, onChange, className = '' }: QualityToggleProps) {
  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Label */}
        <label className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-muted-foreground" />
          Quality
        </label>

        {/* Toggle buttons */}
        <div className="relative flex items-center gap-3 p-1 bg-muted/50 rounded-xl border border-border/50">
          {QUALITY_OPTIONS.map((option) => {
            const isSelected = value === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className="relative flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
              >
                {/* Active background */}
                {isSelected && (
                  <motion.div
                    layoutId="qualityBg"
                    className="absolute inset-0 bg-gradient-to-br from-ocean-500 to-dream-500 rounded-lg shadow-lg"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                {/* Glow effect */}
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.2 }}
                    className="absolute -inset-1 bg-gradient-to-br from-ocean-500 to-dream-500 rounded-xl blur-lg -z-10"
                  />
                )}

                <motion.div
                  className="relative flex flex-col items-center gap-2 px-6 py-4"
                  animate={{
                    scale: isSelected ? 1.02 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {/* Icon */}
                  <motion.div
                    animate={{
                      rotate: isSelected && option.value === 'fast' ? [0, -10, 10, 0] : 0,
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isSelected ? 'text-white' : 'text-muted-foreground'
                      }`}
                    />
                  </motion.div>

                  {/* Label */}
                  <div className="space-y-0.5">
                    <div
                      className={`text-sm font-semibold ${
                        isSelected ? 'text-white' : 'text-foreground'
                      }`}
                    >
                      {option.label}
                    </div>
                    <div
                      className={`text-xs ${
                        isSelected ? 'text-white/80' : 'text-muted-foreground'
                      }`}
                    >
                      {option.description}
                    </div>
                    <div
                      className={`text-xs font-mono ${
                        isSelected ? 'text-white/60' : 'text-muted-foreground/60'
                      }`}
                    >
                      {option.time}
                    </div>
                  </div>
                </motion.div>
              </button>
            );
          })}
        </div>

        {/* Helper text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs text-muted-foreground/80 flex items-center gap-1.5 px-1"
        >
          <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/40" />
          {value === 'standard'
            ? 'Recommended for final outputs'
            : 'Perfect for quick iterations'}
        </motion.p>
      </div>
    </div>
  );
}
