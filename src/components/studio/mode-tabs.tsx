'use client';

import * as React from 'react';
import { Type, Image as ImageIcon, Images, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GenerationMode } from '@/types/api';

interface ModeTabsProps {
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
}

const modes = [
  {
    id: 'text' as const,
    label: 'Text to Image',
    description: 'Generate from text prompt',
    icon: Type,
  },
  {
    id: 'image' as const,
    label: 'Image to Image',
    description: 'Transform with 1 reference',
    icon: ImageIcon,
  },
  {
    id: 'multi-image' as const,
    label: 'Multi-Image',
    description: 'Blend 2-14 images',
    icon: Images,
  },
  {
    id: 'multi-batch' as const,
    label: 'Batch Generation',
    description: '2-14 refs → multiple outputs',
    icon: Layers,
  },
] as const;

export function ModeTabs({ mode, onModeChange }: ModeTabsProps) {
  const [hoveredMode, setHoveredMode] = React.useState<GenerationMode | null>(null);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-1 bg-muted/50 rounded-xl border border-border/50">
        {modes.map((modeItem, index) => {
          const isActive = mode === modeItem.id;
          const isHovered = hoveredMode === modeItem.id;
          const Icon = modeItem.icon;

          return (
            <motion.button
              key={modeItem.id}
              onClick={() => onModeChange(modeItem.id)}
              onHoverStart={() => setHoveredMode(modeItem.id)}
              onHoverEnd={() => setHoveredMode(null)}
              className="relative rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.08 }}
            >
              {/* Background with smooth transition */}
              <AnimatePresence mode="wait">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-background border border-border shadow-sm rounded-lg"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 35,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Hover effect */}
              {isHovered && !isActive && (
                <motion.div
                  layoutId="hoverTab"
                  className="absolute inset-0 bg-accent/50 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              )}

              {/* Content */}
              <div className="relative flex flex-col items-center gap-2 px-4 py-4">
                {/* Icon with gradient background when active */}
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="iconGlow"
                      className="absolute inset-0 bg-gradient-to-br from-ocean-500/20 to-dream-500/20 rounded-lg blur-xl"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.15 : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`relative p-2 rounded-lg ${
                      isActive ? 'bg-gradient-to-br from-ocean-500 to-dream-500' : ''
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        isActive ? 'text-white' : 'text-muted-foreground'
                      }`}
                    />
                  </motion.div>
                </div>

                <div className="flex flex-col items-center gap-0.5">
                  <span
                    className={`text-sm font-medium transition-colors ${
                      isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {modeItem.label}
                  </span>
                  <span className="text-xs text-muted-foreground/70 hidden sm:block">
                    {modeItem.description}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
