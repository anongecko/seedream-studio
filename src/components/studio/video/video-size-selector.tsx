'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Sparkles, Check } from 'lucide-react';
import type { VideoResolution, VideoRatio } from '@/types/video-api';
import { VIDEO_PIXEL_MAP, VIDEO_PARAM_DESCRIPTIONS } from '@/constants/video-parameters';

interface VideoSizeSelectorProps {
  resolution: VideoResolution;
  ratio: VideoRatio;
  onResolutionChange: (value: VideoResolution) => void;
  onRatioChange: (value: VideoRatio) => void;
  className?: string;
}

interface RatioOption {
  id: VideoRatio;
  label: string;
  description: string;
  aspectRatio: number; // For visual representation
  category: 'square' | 'landscape' | 'portrait' | 'adaptive';
}

const RATIO_OPTIONS: RatioOption[] = [
  { id: 'adaptive', label: 'Adaptive', description: 'AI decides', aspectRatio: 16/9, category: 'adaptive' },
  { id: '16:9', label: '16:9', description: 'Wide', aspectRatio: 16/9, category: 'landscape' },
  { id: '4:3', label: '4:3', description: 'Standard', aspectRatio: 4/3, category: 'landscape' },
  { id: '21:9', label: '21:9', description: 'Ultrawide', aspectRatio: 21/9, category: 'landscape' },
  { id: '1:1', label: '1:1', description: 'Square', aspectRatio: 1, category: 'square' },
  { id: '3:4', label: '3:4', description: 'Portrait', aspectRatio: 3/4, category: 'portrait' },
  { id: '9:16', label: '9:16', description: 'Vertical', aspectRatio: 9/16, category: 'portrait' },
];

const RESOLUTION_OPTIONS = [
  { id: '720p' as const, label: '720p HD', description: 'Recommended' },
  { id: '480p' as const, label: '480p SD', description: 'Faster' },
];

export function VideoSizeSelector({
  resolution,
  ratio,
  onResolutionChange,
  onRatioChange,
  className = ''
}: VideoSizeSelectorProps) {
  // Get current dimensions
  const dimensions = ratio === 'adaptive'
    ? 'Adaptive (model decides)'
    : VIDEO_PIXEL_MAP[resolution][ratio];

  const selectedRatioOption = RATIO_OPTIONS.find(opt => opt.id === ratio) || RATIO_OPTIONS[0];

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-teal-500/5">
            <Monitor className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Video Size</h3>
            <p className="text-xs text-muted-foreground">
              {dimensions}
            </p>
          </div>
        </div>

        {/* Resolution selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Resolution</label>
          <div className="grid grid-cols-2 gap-2">
            {RESOLUTION_OPTIONS.map((resOption) => (
              <motion.button
                key={resOption.id}
                onClick={() => onResolutionChange(resOption.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  resolution === resOption.id
                    ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-teal-500/10 shadow-md'
                    : 'border-border hover:border-green-500/30 bg-card'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <div className={`font-semibold ${
                    resolution === resOption.id ? 'text-green-600 dark:text-green-400' : 'text-foreground'
                  }`}>
                    {resOption.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {resOption.description}
                  </div>
                </div>
                {resolution === resOption.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                  >
                    <Check className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Adaptive ratio option - featured */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Aspect Ratio</label>
          <motion.button
            onClick={() => onRatioChange('adaptive')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full rounded-xl border-2 p-4 transition-all ${
              ratio === 'adaptive'
                ? 'border-green-500 bg-gradient-to-br from-green-500/10 to-teal-500/5 shadow-lg shadow-green-500/20'
                : 'border-border hover:border-green-500/30 bg-card'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className={`w-5 h-5 ${ratio === 'adaptive' ? 'text-green-500' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <div className={`text-sm font-semibold ${ratio === 'adaptive' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Adaptive Ratio (Recommended)
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Model chooses best aspect ratio for your prompt
                  </div>
                </div>
              </div>
              {ratio === 'adaptive' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}
            </div>
          </motion.button>
        </div>

        {/* Fixed ratio options */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-muted-foreground">Or choose a fixed aspect ratio:</p>

          {/* Landscape ratios */}
          <div>
            <div className="text-xs text-muted-foreground/70 mb-2 px-1">Landscape</div>
            <div className="grid grid-cols-3 gap-2">
              {RATIO_OPTIONS.filter(opt => opt.category === 'landscape').map((option) => (
                <RatioButton
                  key={option.id}
                  option={option}
                  isSelected={ratio === option.id}
                  onClick={() => onRatioChange(option.id)}
                  resolution={resolution}
                />
              ))}
            </div>
          </div>

          {/* Square ratio */}
          <div>
            <div className="text-xs text-muted-foreground/70 mb-2 px-1">Square</div>
            <div className="grid grid-cols-1 gap-2">
              {RATIO_OPTIONS.filter(opt => opt.category === 'square').map((option) => (
                <RatioButton
                  key={option.id}
                  option={option}
                  isSelected={ratio === option.id}
                  onClick={() => onRatioChange(option.id)}
                  resolution={resolution}
                />
              ))}
            </div>
          </div>

          {/* Portrait ratios */}
          <div>
            <div className="text-xs text-muted-foreground/70 mb-2 px-1">Portrait</div>
            <div className="grid grid-cols-2 gap-2">
              {RATIO_OPTIONS.filter(opt => opt.category === 'portrait').map((option) => (
                <RatioButton
                  key={option.id}
                  option={option}
                  isSelected={ratio === option.id}
                  onClick={() => onRatioChange(option.id)}
                  resolution={resolution}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Helper text */}
        <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
          <p className="text-xs text-muted-foreground">
            {ratio === 'adaptive' ? (
              <>
                <span className="font-medium text-green-600 dark:text-green-400">Adaptive mode:</span>{' '}
                The AI will analyze your prompt and choose the most suitable aspect ratio automatically.
              </>
            ) : (
              <>
                <span className="font-medium text-green-600 dark:text-green-400">{ratio} ratio:</span>{' '}
                {VIDEO_PARAM_DESCRIPTIONS.ratio[ratio as keyof typeof VIDEO_PARAM_DESCRIPTIONS.ratio]}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// Ratio button component
interface RatioButtonProps {
  option: RatioOption;
  isSelected: boolean;
  onClick: () => void;
  resolution: VideoResolution;
}

function RatioButton({ option, isSelected, onClick, resolution }: RatioButtonProps) {
  const dimensions = VIDEO_PIXEL_MAP[resolution][option.id as keyof typeof VIDEO_PIXEL_MAP['720p']];

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`group relative overflow-hidden rounded-lg border transition-all ${
        isSelected
          ? 'border-green-500 bg-gradient-to-br from-green-500 to-teal-500 text-white shadow-lg'
          : 'border-border hover:border-green-500/30 bg-card'
      }`}
    >
      <div className="relative p-3 space-y-2">
        {/* Visual aspect ratio representation */}
        <div className="flex items-center justify-center h-12">
          <div
            className={`relative rounded-sm ${
              isSelected
                ? 'bg-white/20 ring-2 ring-white/30'
                : 'bg-gradient-to-br from-green-500/20 to-teal-500/20'
            }`}
            style={{
              width: option.aspectRatio >= 1 ? '100%' : `${option.aspectRatio * 100}%`,
              maxWidth: '48px',
              height: option.aspectRatio <= 1 ? '100%' : `${(1 / option.aspectRatio) * 100}%`,
              maxHeight: '48px',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-[10px] font-bold ${
                isSelected ? 'text-white/70' : 'text-green-500/60'
              }`}>
                {option.label}
              </span>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="text-center space-y-0.5">
          <div className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-foreground'}`}>
            {option.description}
          </div>
          <div className={`text-xs font-mono ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>
            {dimensions}
          </div>
        </div>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-4 h-4 rounded-full bg-white flex items-center justify-center"
        >
          <Check className="w-2.5 h-2.5 text-green-500" />
        </motion.div>
      )}

      {/* Hover effect */}
      {!isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-teal-500/0 group-hover:from-green-500/5 group-hover:to-teal-500/5 transition-all duration-300" />
      )}
    </motion.button>
  );
}
