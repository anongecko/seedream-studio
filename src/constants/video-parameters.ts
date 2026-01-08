/**
 * Video generation parameter constraints and defaults for Seedance 1.5 Pro
 * Based on API documentation from VIDEO-GEN.md
 */

import type {
  VideoMode,
  VideoDuration,
  VideoResolution,
  VideoRatio,
  VideoServiceTier,
} from '@/types/video-api';

// ============================================================================
// Parameter Constraints
// ============================================================================

export const VIDEO_CONSTRAINTS = {
  // Duration constraints
  duration: {
    min: 4,
    max: 12,
    auto: -1, // Model decides (4-12s range)
    default: -1 as VideoDuration,
  },

  // Resolution options
  resolutions: ['480p', '720p'] as const,
  // Note: 1080p is NOT supported for Seedance 1.5 Pro

  // Aspect ratio options
  ratios: [
    '16:9',    // Wide (standard landscape)
    '4:3',     // Standard (classic TV)
    '1:1',     // Square
    '3:4',     // Portrait
    '9:16',    // Vertical (mobile)
    '21:9',    // Ultrawide
    'adaptive', // Model chooses best ratio
  ] as const,

  // Frame rate (only one option)
  fps: 24 as const,

  // Service tiers
  serviceTiers: ['default', 'flex'] as const,

  // Image count requirements per mode
  imageCounts: {
    'text-to-video': 0,
    'image-to-video-first': 1,
    'image-to-video-frames': 2,
    'image-to-video-ref': { min: 1, max: 4 },
  } as const,

  // Image format support
  imageFormats: ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'tiff', 'tif', 'gif'] as const,

  // Image constraints
  image: {
    maxSize: 10 * 1024 * 1024, // 10 MB
    aspectRatio: { min: 1/3, max: 3 },
    minDimension: 14,
  },
} as const;

// ============================================================================
// Default Values
// ============================================================================

export const VIDEO_DEFAULTS = {
  duration: -1 as VideoDuration, // Auto (model decides)
  resolution: '720p' as VideoResolution,
  ratio: 'adaptive' as VideoRatio,
  generateAudio: true,
  serviceTier: 'default' as VideoServiceTier,
  returnLastFrame: false,
  fps: 24 as const,
  watermark: false, // Always false
  cameraFixed: false, // Default to not fixed
} as const;

// ============================================================================
// Pixel Dimension Mappings
// ============================================================================

/**
 * Maps resolution + ratio combinations to actual pixel dimensions
 * Based on API documentation
 */
export const VIDEO_PIXEL_MAP = {
  '480p': {
    '16:9': '864×496',
    '4:3': '752×560',
    '1:1': '640×640',
    '3:4': '560×752',
    '9:16': '496×864',
    '21:9': '992×432',
  },
  '720p': {
    '16:9': '1280×720',
    '4:3': '1112×834',
    '1:1': '960×960',
    '3:4': '834×1112',
    '9:16': '720×1280',
    '21:9': '1470×630',
  },
} as const;

/**
 * Get pixel dimensions for a resolution + ratio combination
 */
export function getVideoDimensions(
  resolution: VideoResolution,
  ratio: VideoRatio
): string | null {
  if (ratio === 'adaptive') {
    return 'Adaptive (model decides)';
  }
  return VIDEO_PIXEL_MAP[resolution][ratio] || null;
}

// ============================================================================
// Parameter Descriptions
// ============================================================================

export const VIDEO_PARAM_DESCRIPTIONS = {
  duration: {
    auto: 'Model decides duration (4-12s) based on prompt',
    fixed: 'Fixed duration in seconds',
  },
  resolution: {
    '480p': 'Lower resolution, faster generation',
    '720p': 'Higher resolution, better quality (recommended)',
  },
  ratio: {
    '16:9': 'Wide (standard landscape video)',
    '4:3': 'Standard (classic TV format)',
    '1:1': 'Square (social media posts)',
    '3:4': 'Portrait (vertical crop)',
    '9:16': 'Vertical (mobile/TikTok)',
    '21:9': 'Ultrawide (cinematic)',
    'adaptive': 'Model chooses best aspect ratio for prompt',
  },
  serviceTier: {
    'default': 'Online mode: Lower latency, real-time generation',
    'flex': 'Offline mode: 50% cheaper, longer wait times',
  },
  generateAudio: {
    true: 'Generate synchronized voice, sound effects, or background music',
    false: 'Silent video (no audio track)',
  },
  returnLastFrame: {
    true: 'Return last frame image for chaining multiple videos',
    false: 'No last frame image returned',
  },
} as const;

// ============================================================================
// Mode Configurations
// ============================================================================

export interface VideoModeConfig {
  id: VideoMode;
  label: string;
  description: string;
  imageCount: number | { min: number; max: number };
  imageRoleDescription?: string;
}

export const VIDEO_MODE_CONFIGS: VideoModeConfig[] = [
  {
    id: 'text-to-video',
    label: 'Text to Video',
    description: 'Generate video from text prompt only',
    imageCount: 0,
  },
  {
    id: 'image-to-video-first',
    label: 'First Frame',
    description: 'Use one image as the first frame',
    imageCount: 1,
    imageRoleDescription: 'Upload the starting frame for your video',
  },
  {
    id: 'image-to-video-frames',
    label: 'First + Last Frame',
    description: 'Control both start and end frames',
    imageCount: 2,
    imageRoleDescription: 'Upload first frame and last frame images',
  },
  {
    id: 'image-to-video-ref',
    label: 'Reference Images',
    description: 'Use 1-4 images as visual references',
    imageCount: { min: 1, max: 4 },
    imageRoleDescription: 'Upload 1-4 reference images to guide generation',
  },
];

/**
 * Get mode configuration by ID
 */
export function getVideoModeConfig(mode: VideoMode): VideoModeConfig | undefined {
  return VIDEO_MODE_CONFIGS.find(config => config.id === mode);
}

/**
 * Get maximum image count for a mode
 */
export function getMaxImagesForMode(mode: VideoMode): number {
  const count = VIDEO_CONSTRAINTS.imageCounts[mode];
  if (count === undefined) {
    throw new Error(`Invalid video mode: ${mode}`);
  }
  return typeof count === 'number' ? count : count.max;
}

/**
 * Get minimum image count for a mode
 */
export function getMinImagesForMode(mode: VideoMode): number {
  const count = VIDEO_CONSTRAINTS.imageCounts[mode];
  if (count === undefined) {
    throw new Error(`Invalid video mode: ${mode}`);
  }
  return typeof count === 'number' ? count : count.min;
}

/**
 * Validate image count for a mode
 */
export function validateImageCount(mode: VideoMode, count: number): boolean {
  const constraint = VIDEO_CONSTRAINTS.imageCounts[mode];
  if (typeof constraint === 'number') {
    return count === constraint;
  }
  return count >= constraint.min && count <= constraint.max;
}

// ============================================================================
// Duration Options
// ============================================================================

export const DURATION_OPTIONS: Array<{
  value: VideoDuration;
  label: string;
  description: string;
}> = [
  { value: -1, label: 'Auto (4-12s)', description: 'Model decides based on prompt' },
  { value: 4, label: '4 seconds', description: 'Short video' },
  { value: 5, label: '5 seconds', description: 'Quick clip' },
  { value: 6, label: '6 seconds', description: 'Brief scene' },
  { value: 8, label: '8 seconds', description: 'Standard length' },
  { value: 10, label: '10 seconds', description: 'Extended clip' },
  { value: 12, label: '12 seconds', description: 'Maximum duration' },
];

// ============================================================================
// Text Command Helpers
// ============================================================================

/**
 * Build text command string from parameters
 * These are appended to the prompt: "Your prompt --rt 16:9 --dur 8"
 */
export function buildTextCommands(params: {
  ratio?: VideoRatio;
  duration?: VideoDuration;
  resolution?: VideoResolution;
  fps?: number;
  watermark?: boolean;
  cameraFixed?: boolean;
}): string {
  const commands: string[] = [];

  // Ratio (--rt)
  if (params.ratio && params.ratio !== 'adaptive') {
    commands.push(`--rt ${params.ratio}`);
  }

  // Duration (--dur)
  if (params.duration && params.duration !== -1) {
    commands.push(`--dur ${params.duration}`);
  }

  // Resolution (--rs)
  if (params.resolution) {
    commands.push(`--rs ${params.resolution}`);
  }

  // FPS (--fps) - usually omitted since 24 is default
  if (params.fps && params.fps !== 24) {
    commands.push(`--fps ${params.fps}`);
  }

  // Watermark (--wm)
  if (params.watermark === true) {
    commands.push('--wm true');
  }

  // Camera fixed (--cf)
  if (params.cameraFixed === true) {
    commands.push('--cf true');
  }

  return commands.length > 0 ? ' ' + commands.join(' ') : '';
}

/**
 * Parse text commands from prompt
 * Extracts --commands from end of prompt
 */
export function parseTextCommands(prompt: string): {
  cleanPrompt: string;
  commands: Record<string, string>;
} {
  const commandPattern = /\s+(--\w+\s+[^\s-]+)/g;
  const matches = prompt.match(commandPattern) || [];

  const commands: Record<string, string> = {};
  matches.forEach(match => {
    const [key, value] = match.trim().replace('--', '').split(/\s+/);
    commands[key] = value;
  });

  const cleanPrompt = prompt.replace(commandPattern, '').trim();

  return { cleanPrompt, commands };
}
