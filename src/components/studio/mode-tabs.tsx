'use client';

import * as React from 'react';
import { Type, Image as ImageIcon, Images, Layers, Video as VideoIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { UnifiedMode } from '@/types/api';
import type { VideoMode, MediaType } from '@/types/video-api';
import type { GenerationMode } from '@/types/api';

interface ModeTabsProps {
  mode: UnifiedMode;
  onModeChange: (mode: UnifiedMode) => void;
  mediaType: MediaType;
}

interface ModeConfig {
  id: UnifiedMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * Get mode configurations based on media type
 */
function getModesForMedia(mediaType: MediaType): ModeConfig[] {
  if (mediaType === 'image') {
    return [
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
    ];
  } else {
    // Video modes
    return [
      {
        id: 'text-to-video' as const,
        label: 'Text to Video',
        description: 'Generate from text prompt',
        icon: Type,
      },
      {
        id: 'image-to-video-first' as const,
        label: 'First Frame',
        description: 'Use 1 image as first frame',
        icon: ImageIcon,
      },
      {
        id: 'image-to-video-ref' as const,
        label: 'Reference Images',
        description: 'Use 1-4 reference images',
        icon: Images,
      },
      {
        id: 'image-to-video-frames' as const,
        label: 'First + Last',
        description: 'Control both start & end',
        icon: Layers,
      },
    ];
  }
}

/**
 * Map mode when switching between image and video models
 * Ensures users land on a similar mode when switching
 */
export function mapModeOnModelSwitch(
  currentMode: UnifiedMode,
  newMediaType: MediaType
): UnifiedMode {
  if (newMediaType === 'video') {
    // Image → Video mapping
    if (currentMode === 'text') return 'text-to-video';
    if (currentMode === 'image') return 'image-to-video-first';
    if (currentMode === 'multi-image') return 'image-to-video-ref';
    if (currentMode === 'multi-batch') return 'image-to-video-frames';
    // Already a video mode, keep it
    return currentMode;
  } else {
    // Video → Image mapping
    if (currentMode === 'text-to-video') return 'text';
    if (currentMode === 'image-to-video-first') return 'image';
    if (currentMode === 'image-to-video-ref') return 'multi-image';
    if (currentMode === 'image-to-video-frames') return 'multi-batch';
    // Already an image mode, keep it
    return currentMode;
  }
}

export function ModeTabs({ mode, onModeChange, mediaType }: ModeTabsProps) {
  const [hoveredMode, setHoveredMode] = React.useState<UnifiedMode | null>(null);
  const modes = getModesForMedia(mediaType);

  return (
    <div className="w-full">
      {/* Media type indicator */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50">
          {mediaType === 'video' && <VideoIcon className="w-3.5 h-3.5 text-green-500" />}
          {mediaType === 'image' && <ImageIcon className="w-3.5 h-3.5 text-blue-500" />}
          <span className="text-xs font-medium text-muted-foreground">
            {mediaType === 'image' ? 'Image Generation' : 'Video Generation'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-1 bg-muted/50 rounded-xl border border-border/50">
        <AnimatePresence mode="wait">
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
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                {/* Background with smooth transition */}
                <AnimatePresence mode="wait">
                  {isActive && (
                    <motion.div
                      layoutId={`activeTab-${mediaType}`}
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
                    layoutId={`hoverTab-${mediaType}`}
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
                        layoutId={`iconGlow-${mediaType}`}
                        className={`absolute inset-0 rounded-lg blur-xl ${
                          mediaType === 'video'
                            ? 'bg-gradient-to-br from-green-500/20 to-teal-500/20'
                            : 'bg-gradient-to-br from-ocean-500/20 to-dream-500/20'
                        }`}
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
                        isActive
                          ? mediaType === 'video'
                            ? 'bg-gradient-to-br from-green-500 to-teal-500'
                            : 'bg-gradient-to-br from-ocean-500 to-dream-500'
                          : ''
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
        </AnimatePresence>
      </div>
    </div>
  );
}
