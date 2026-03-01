'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Check } from 'lucide-react';
import type { SeedreamModel } from '@/types/api';
import { getAvailableTiers, getDimensionsForTier, type SizeDimensionEntry } from '@/lib/model-registry';

interface SizeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  model: SeedreamModel;
  className?: string;
}

const CATEGORY_LABELS = {
  square: 'Square',
  landscape: 'Landscape',
  portrait: 'Portrait',
};

export function SizeSelector({ value, onChange, model, className = '' }: SizeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<'square' | 'landscape' | 'portrait'>('square');
  const [resolutionTier, setResolutionTier] = React.useState('2K');

  // Get available tiers from registry
  const availableTiers = React.useMemo(() => getAvailableTiers(model), [model]);

  // Get dimensions for current tier
  const tierDimensions = React.useMemo(
    () => getDimensionsForTier(model, resolutionTier),
    [model, resolutionTier],
  );

  // Auto-snap tier when model changes (e.g., 4.0 on 1K → switch to 4.5 → snap to 2K)
  React.useEffect(() => {
    if (!availableTiers.includes(resolutionTier)) {
      const newTier = availableTiers.includes('2K') ? '2K' : availableTiers[0];
      setResolutionTier(newTier);
    }
  }, [availableTiers, resolutionTier]);

  // Find the currently selected option from tier dimensions
  const selectedOption = React.useMemo(() => {
    // value uses display format with × (e.g., "2048×2048"), dimensions use x
    const apiValue = value.replace('×', 'x');
    return tierDimensions.find((d) => d.dimensions === apiValue) || tierDimensions[0];
  }, [value, tierDimensions]);

  // Update category when value changes externally
  React.useEffect(() => {
    if (selectedOption) {
      setSelectedCategory(selectedOption.category);
    }
  }, [selectedOption]);

  // When tier changes, find matching aspect ratio in new tier and update value
  const handleTierChange = React.useCallback(
    (tier: string) => {
      setResolutionTier(tier);
      const newDimensions = getDimensionsForTier(model, tier);
      // Try to keep same aspect ratio
      const currentLabel = selectedOption?.label;
      const match = newDimensions.find((d) => d.label === currentLabel);
      const fallback = newDimensions[0];
      onChange((match || fallback).displayDimensions);
    },
    [model, selectedOption, onChange],
  );

  const handleSelect = (option: SizeDimensionEntry) => {
    onChange(option.displayDimensions);
    setSelectedCategory(option.category);
  };

  const categorizedOptions = React.useMemo(() => {
    return tierDimensions.filter((opt) => opt.category === selectedCategory);
  }, [selectedCategory, tierDimensions]);

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Label and current selection */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <Maximize2 className="h-4 w-4 text-muted-foreground" />
            Output Size
          </label>
          <div className="text-sm">
            <span className="font-mono text-ocean-500">{selectedOption?.displayDimensions}</span>
            <span className="text-muted-foreground/60 ml-2">({selectedOption?.ratio})</span>
          </div>
        </div>

        {/* Resolution Tier Pills */}
        <div className="flex items-center gap-2">
          {availableTiers.map((tier) => (
            <button
              key={tier}
              onClick={() => handleTierChange(tier)}
              className={`relative px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                resolutionTier === tier
                  ? 'bg-gradient-to-r from-ocean-500 to-dream-500 text-white shadow-md'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50'
              }`}
            >
              {tier}
            </button>
          ))}
          <span className="text-xs text-muted-foreground/60 ml-2">
            {resolutionTier === '1K' && 'Standard'}
            {resolutionTier === '2K' && 'High Quality'}
            {resolutionTier === '4K' && 'Ultra HD'}
          </span>
        </div>

        {/* Category selector */}
        <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg border border-border/50">
          {(['square', 'landscape', 'portrait'] as const).map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className="relative flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {/* Active background */}
              {selectedCategory === category && (
                <motion.div
                  layoutId="categoryBg"
                  className="absolute inset-0 bg-background border border-border shadow-sm rounded-md"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}

              <span
                className={`relative ${
                  selectedCategory === category ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {CATEGORY_LABELS[category]}
              </span>
            </button>
          ))}
        </div>

        {/* Size options grid */}
        <motion.div
          key={`${selectedCategory}-${resolutionTier}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <AnimatePresence mode="wait">
            {categorizedOptions.map((option, index) => {
              const isSelected = selectedOption?.label === option.label;

              return (
                <motion.button
                  key={option.label}
                  onClick={() => handleSelect(option)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group relative overflow-hidden rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-ocean-500 bg-gradient-to-br from-ocean-500/10 to-dream-500/10'
                      : 'border-border bg-card hover:border-ocean-500/50'
                  }`}
                >
                  {/* Selected indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="absolute top-2 right-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-ocean-500 to-dream-500 shadow-lg"
                      >
                        <Check className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Subtle glow on selected */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-ocean-500/5 to-dream-500/5" />
                  )}

                  <div className="relative p-4 space-y-3">
                    {/* Visual aspect ratio representation */}
                    <div className="flex items-center justify-center h-16">
                      <div
                        className={`relative bg-gradient-to-br from-ocean-500/20 to-dream-500/20 rounded-md ${
                          isSelected ? 'ring-2 ring-ocean-500/30' : ''
                        }`}
                        style={{
                          width: option.aspectRatio >= 1 ? '100%' : `${option.aspectRatio * 100}%`,
                          maxWidth: '64px',
                          height: option.aspectRatio <= 1 ? '100%' : `${(1 / option.aspectRatio) * 100}%`,
                          maxHeight: '64px',
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-ocean-500/60">
                            {option.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ratio label */}
                    <div className="text-center space-y-1">
                      <div className="text-sm font-semibold">{option.ratio}</div>
                      <div className="text-xs text-muted-foreground font-mono">{option.displayDimensions}</div>
                    </div>
                  </div>

                  {/* Hover effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-ocean-500/0 to-dream-500/0 group-hover:from-ocean-500/5 group-hover:to-dream-500/5 transition-all duration-300" />
                </motion.button>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Preset info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between text-xs text-muted-foreground/80 px-1"
        >
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>Default: 2048×2048 (1:1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Quality over quantity</span>
            <span className="inline-block w-1 h-1 rounded-full bg-muted-foreground/40" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
