'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, ChevronDown, Zap, Clock, Image } from 'lucide-react';
import type { VideoServiceTier } from '@/types/video-api';

interface AdvancedOptionsProps {
  serviceTier: VideoServiceTier;
  returnLastFrame: boolean;
  cameraFixed?: boolean;
  onServiceTierChange: (tier: VideoServiceTier) => void;
  onReturnLastFrameChange: (enabled: boolean) => void;
  onCameraFixedChange?: (enabled: boolean) => void;
  className?: string;
}

export function AdvancedOptions({
  serviceTier,
  returnLastFrame,
  cameraFixed = false,
  onServiceTierChange,
  onReturnLastFrameChange,
  onCameraFixedChange,
  className = ''
}: AdvancedOptionsProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Keyboard navigation helper
  const handleToggleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Collapsible header */}
        <motion.button
          onClick={() => setIsExpanded(!isExpanded)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full rounded-xl border-2 border-border bg-card p-4 transition-all hover:border-green-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-teal-500/5">
                <Settings2 className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold">Advanced Options</h3>
                <p className="text-xs text-muted-foreground">
                  {isExpanded ? 'Click to collapse' : 'Service tier, last frame export, and more'}
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </motion.div>
          </div>
        </motion.button>

        {/* Collapsible content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Service Tier */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-500" />
                  <h4 className="text-sm font-semibold">Service Tier</h4>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Default tier */}
                  <motion.button
                    onClick={() => onServiceTierChange('default')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`rounded-lg border p-3 transition-all ${
                      serviceTier === 'default'
                        ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-teal-500/5 shadow-md'
                        : 'border-border hover:border-green-500/30 bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className={`w-3.5 h-3.5 ${serviceTier === 'default' ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-semibold ${serviceTier === 'default' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Default
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground text-left">
                      Online mode: Lower latency, real-time generation
                    </p>
                    {serviceTier === 'default' && (
                      <div className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                        ✓ Recommended
                      </div>
                    )}
                  </motion.button>

                  {/* Flex tier */}
                  <motion.button
                    onClick={() => onServiceTierChange('flex')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`rounded-lg border p-3 transition-all ${
                      serviceTier === 'flex'
                        ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-teal-500/5 shadow-md'
                        : 'border-border hover:border-green-500/30 bg-background'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className={`w-3.5 h-3.5 ${serviceTier === 'flex' ? 'text-green-500' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-semibold ${serviceTier === 'flex' ? 'text-foreground' : 'text-muted-foreground'}`}>
                        Flex
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground text-left">
                      Offline mode: 50% cheaper, longer wait times
                    </p>
                    {serviceTier === 'flex' && (
                      <div className="mt-2 text-xs font-medium text-green-600 dark:text-green-400">
                        ✓ Economy mode
                      </div>
                    )}
                  </motion.button>
                </div>

                <div className="rounded-lg bg-muted/50 p-2.5 border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    {serviceTier === 'default' ? (
                      <>
                        <span className="font-medium text-green-600 dark:text-green-400">Default tier:</span>{' '}
                        Best for interactive workflows. Generation typically completes in 30-60 seconds.
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-green-600 dark:text-green-400">Flex tier:</span>{' '}
                        Save 50% on costs. Generation may take several minutes. Use for batch jobs or when time isn't critical.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Return Last Frame */}
              <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-green-500" />
                  <h4 className="text-sm font-semibold">Last Frame Export</h4>
                </div>

                <motion.button
                  onClick={() => onReturnLastFrameChange(!returnLastFrame)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className={`w-full rounded-lg border p-3 transition-all ${
                    returnLastFrame
                      ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-teal-500/5'
                      : 'border-border hover:border-green-500/30 bg-background'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Toggle switch */}
                      <div
                        className={`relative h-5 w-9 rounded-full transition-colors ${
                          returnLastFrame ? 'bg-green-500' : 'bg-muted'
                        }`}
                      >
                        <motion.div
                          initial={false}
                          animate={{
                            x: returnLastFrame ? 16 : 2,
                          }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
                        />
                      </div>

                      <div className="text-left">
                        <div className={`text-sm font-semibold ${returnLastFrame ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {returnLastFrame ? 'Enabled' : 'Disabled'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Export last frame as separate image
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.button>

                <div className="rounded-lg bg-muted/50 p-2.5 border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    {returnLastFrame ? (
                      <>
                        <span className="font-medium text-green-600 dark:text-green-400">Last frame enabled:</span>{' '}
                        The final frame will be returned as a separate image. Useful for chaining multiple videos together
                        by using the last frame as the first frame of the next video.
                      </>
                    ) : (
                      <>
                        <span className="font-medium">Tip:</span>{' '}
                        Enable this if you plan to create a sequence of connected videos. The last frame can be used as
                        the starting point for your next generation.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Text Commands Info */}
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-500/10">
                    <Settings2 className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <h4 className="text-xs font-semibold text-green-600 dark:text-green-400">
                    Advanced Text Commands
                  </h4>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You can add advanced commands to your prompt for fine-grained control:
                </p>
                <div className="space-y-1 text-xs font-mono">
                  <div className="text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">--cf true</span> - Fix camera position (no movement)
                  </div>
                  <div className="text-muted-foreground">
                    <span className="text-green-600 dark:text-green-400">--wm true</span> - Add watermark to video
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70 pt-1">
                  These commands are automatically added based on your settings above.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
