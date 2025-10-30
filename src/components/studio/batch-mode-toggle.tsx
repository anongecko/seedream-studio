'use client';

import { motion } from 'framer-motion';
import { Images, Sparkles } from 'lucide-react';
import { PARAMETER_CONSTRAINTS } from '@/constants/parameters';
import type { GenerationMode } from '@/types/api';

interface BatchModeToggleProps {
  mode: GenerationMode;
  referenceImageCount: number;
  batchEnabled: boolean;
  maxImages: number;
  onBatchEnabledChange: (enabled: boolean) => void;
  onMaxImagesChange: (max: number) => void;
}

/**
 * Calculate max images constraint based on mode and reference image count
 * - Text mode: up to 15 images
 * - Image mode (1 ref): up to 14 images
 * - Multi-image mode (n refs): up to (15 - n) images
 */
function calculateMaxImagesLimit(mode: GenerationMode, referenceImageCount: number): number {
  if (mode === 'text') {
    return PARAMETER_CONSTRAINTS.batch.maxImagesBase;
  } else if (mode === 'image') {
    return PARAMETER_CONSTRAINTS.batch.maxImagesWithSingleRef;
  } else {
    // multi-image: total input + output <= 15
    return Math.max(1, PARAMETER_CONSTRAINTS.batch.maxImagesConstraint - referenceImageCount);
  }
}

export function BatchModeToggle({
  mode,
  referenceImageCount,
  batchEnabled,
  maxImages,
  onBatchEnabledChange,
  onMaxImagesChange,
}: BatchModeToggleProps) {
  // Calculate constraint
  const maxLimit = calculateMaxImagesLimit(mode, referenceImageCount);

  // Adjust maxImages if it exceeds new limit
  if (batchEnabled && maxImages > maxLimit) {
    onMaxImagesChange(maxLimit);
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card/50 p-6">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5">
            <Images className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Batch Generation</h3>
            <p className="text-xs text-muted-foreground">
              Generate multiple related images at once
            </p>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          onClick={() => onBatchEnabledChange(!batchEnabled)}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
            ${batchEnabled ? 'bg-gradient-to-r from-ocean-500 to-dream-500' : 'bg-muted'}
          `}
        >
          <motion.span
            layout
            className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg"
            animate={{ x: batchEnabled ? 24 : 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </div>

      {/* Max images slider - shown when batch enabled */}
      {batchEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Maximum Images</label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-ocean-500 to-dream-500 bg-clip-text text-transparent">
                {maxImages}
              </span>
              <span className="text-xs text-muted-foreground">
                / {maxLimit}
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <div className="relative">
              <input
                type="range"
                min="1"
                max={maxLimit}
                value={maxImages}
                onChange={(e) => onMaxImagesChange(parseInt(e.target.value, 10))}
                className="w-full h-2 rounded-lg cursor-pointer"
                style={{
                  background: `linear-gradient(to right,
                    oklch(0.55 0.18 245) 0%,
                    oklch(0.75 0.20 185) ${((maxImages - 1) / Math.max(1, maxLimit - 1)) * 100}%,
                    hsl(var(--muted)) ${((maxImages - 1) / Math.max(1, maxLimit - 1)) * 100}%,
                    hsl(var(--muted)) 100%)`,
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
              />
              <style jsx>{`
                input[type="range"]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, oklch(0.55 0.18 245), oklch(0.75 0.20 185));
                  cursor: pointer;
                  box-shadow: 0 2px 8px rgba(0, 135, 255, 0.3);
                  transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                input[type="range"]::-webkit-slider-thumb:hover {
                  transform: scale(1.1);
                  box-shadow: 0 3px 12px rgba(0, 135, 255, 0.5);
                }
                input[type="range"]::-webkit-slider-thumb:active {
                  transform: scale(0.95);
                }
                input[type="range"]::-moz-range-thumb {
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, oklch(0.55 0.18 245), oklch(0.75 0.20 185));
                  cursor: pointer;
                  border: none;
                  box-shadow: 0 2px 8px rgba(0, 135, 255, 0.3);
                  transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                input[type="range"]::-moz-range-thumb:hover {
                  transform: scale(1.1);
                  box-shadow: 0 3px 12px rgba(0, 135, 255, 0.5);
                }
                input[type="range"]::-moz-range-thumb:active {
                  transform: scale(0.95);
                }
              `}</style>
            </div>

            {/* Tick marks for reference */}
            <div className="flex justify-between px-0.5 mt-1">
              {Array.from({ length: Math.min(maxLimit, 15) }, (_, i) => i + 1).map((num) => (
                <div
                  key={num}
                  className="flex flex-col items-center"
                  style={{ width: `${100 / Math.min(maxLimit, 15)}%` }}
                >
                  <div
                    className={`h-1 w-px ${
                      num <= maxImages ? 'bg-ocean-500' : 'bg-muted-foreground/20'
                    }`}
                  />
                  {(num === 1 || num === maxLimit || num % 5 === 0) && (
                    <span className="text-[9px] text-muted-foreground/50 mt-0.5">
                      {num}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Helper text with constraints */}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 mt-0.5 shrink-0 text-purple-500" />
              <p>
                {mode === 'text' && `Generate up to ${maxLimit} related images from your prompt`}
                {mode === 'image' && `Generate up to ${maxLimit} variations using your reference image`}
                {mode === 'multi-image' && (
                  <>
                    With {referenceImageCount} reference image{referenceImageCount > 1 ? 's' : ''},
                    generate up to {maxLimit} output image{maxLimit > 1 ? 's' : ''}
                    <span className="block mt-1 text-[10px] text-muted-foreground/60">
                      (Total: {referenceImageCount} input + {maxLimit} output ≤ 15)
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
