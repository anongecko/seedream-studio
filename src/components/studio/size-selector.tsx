'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Check } from 'lucide-react';
import type { SeedreamModel } from '@/types/api';
import { getModelConstraints } from '@/constants/parameters';

interface SizeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  model: SeedreamModel;
  className?: string;
}

interface SizeOption {
  id: string;
  label: string;
  ratio: string;
  dimensions: string;
  aspectRatio: number; // For visual representation
  category: 'square' | 'landscape' | 'portrait';
}

// All available size options (will be filtered by model constraints)
const ALL_SIZE_OPTIONS: SizeOption[] = [
  // Square
  { id: '1:1', label: '1:1', ratio: 'Square', dimensions: '2048×2048', aspectRatio: 1, category: 'square' },

  // Landscape
  { id: '16:9', label: '16:9', ratio: 'Wide', dimensions: '2560×1440', aspectRatio: 16 / 9, category: 'landscape' },
  { id: '4:3', label: '4:3', ratio: 'Landscape', dimensions: '2304×1728', aspectRatio: 4 / 3, category: 'landscape' },
  { id: '3:2', label: '3:2', ratio: 'Classic', dimensions: '2496×1664', aspectRatio: 3 / 2, category: 'landscape' },
  { id: '21:9', label: '21:9', ratio: 'Ultrawide', dimensions: '3024×1296', aspectRatio: 21 / 9, category: 'landscape' },

  // Portrait
  { id: '9:16', label: '9:16', ratio: 'Tall', dimensions: '1440×2560', aspectRatio: 9 / 16, category: 'portrait' },
  { id: '3:4', label: '3:4', ratio: 'Portrait', dimensions: '1728×2304', aspectRatio: 3 / 4, category: 'portrait' },
  { id: '2:3', label: '2:3', ratio: 'Photo', dimensions: '1664×2496', aspectRatio: 2 / 3, category: 'portrait' },
];

const CATEGORY_LABELS = {
  square: 'Square',
  landscape: 'Landscape',
  portrait: 'Portrait',
};

export function SizeSelector({ value, onChange, model, className = '' }: SizeSelectorProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<'square' | 'landscape' | 'portrait'>('square');

  // Get model constraints
  const constraints = getModelConstraints(model);

  // Filter size options based on model constraints
  const SIZE_OPTIONS = React.useMemo(() => {
    return ALL_SIZE_OPTIONS.filter((option) => {
      // Parse dimensions
      const [width, height] = option.dimensions.split('×').map(Number);
      const totalPixels = width * height;

      // Check if within model limits
      return totalPixels >= constraints.size.minTotalPixels &&
             totalPixels <= constraints.size.maxTotalPixels;
    });
  }, [model, constraints]);

  // Find selected option or default to first available
  const selectedOption = SIZE_OPTIONS.find((opt) => opt.dimensions === value) || SIZE_OPTIONS[0];

  React.useEffect(() => {
    // Update category when value changes
    if (selectedOption) {
      setSelectedCategory(selectedOption.category);
    }
  }, [selectedOption]);

  const handleSelect = (option: SizeOption) => {
    onChange(option.dimensions);
    setSelectedCategory(option.category);
  };

  const categorizedOptions = React.useMemo(() => {
    return SIZE_OPTIONS.filter((opt) => opt.category === selectedCategory);
  }, [selectedCategory, SIZE_OPTIONS]);

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
            <span className="font-mono text-ocean-500">{selectedOption.dimensions}</span>
            <span className="text-muted-foreground/60 ml-2">({selectedOption.ratio})</span>
          </div>
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
          key={selectedCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <AnimatePresence mode="wait">
            {categorizedOptions.map((option, index) => {
              const isSelected = selectedOption.id === option.id;

              return (
                <motion.button
                  key={option.id}
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
                      <div className="text-xs text-muted-foreground font-mono">{option.dimensions}</div>
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
