import type { Quality, SizePreset, ResponseFormat } from '@/types/api';

/**
 * Parameter constraints from API_REFERENCE.md
 */
export const PARAMETER_CONSTRAINTS = {
  imageUrl: {
    maxCount: 14, // Seedream 4.5: Max 14 reference images
    formats: ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'tiff', 'gif'], // Seedream 4.5: Expanded format support
    maxSize: 10 * 1024 * 1024, // 10 MB
    aspectRatio: { min: 1 / 16, max: 16 }, // Seedream 4.5: Expanded from [1/3, 3] to [1/16, 16]
    minDimension: 14,
    maxTotalPixels: 6000 * 6000,
  },

  size: {
    presets: ['2K', '4K'] as const, // Seedream 4.5: Removed '1K' preset
    customRange: {
      min: { width: 2560, height: 1440 }, // Seedream 4.5: Higher minimum (was 1280x720)
      max: { width: 4096, height: 4096 },
    },
    minTotalPixels: 2560 * 1440, // 3,686,400 pixels minimum
    aspectRatioRange: { min: 1 / 16, max: 16 },
    common: [
      { label: '1:1 Square', ratio: '1:1', value: '2048x2048' },
      { label: '4:3 Landscape', ratio: '4:3', value: '2304x1728' },
      { label: '3:4 Portrait', ratio: '3:4', value: '1728x2304' },
      { label: '16:9 Wide', ratio: '16:9', value: '2560x1440' },
      { label: '9:16 Tall', ratio: '9:16', value: '1440x2560' },
      { label: '3:2 Photo', ratio: '3:2', value: '2496x1664' },
      { label: '2:3 Portrait', ratio: '2:3', value: '1664x2496' },
      { label: '21:9 Ultrawide', ratio: '21:9', value: '3024x1296' },
    ] as const,
  },

  quality: {
    options: ['standard', 'fast'] as const,
    descriptions: {
      standard: 'Higher quality, longer generation time',
      fast: 'Faster generation, average quality',
    },
  },

  batch: {
    maxImagesBase: 15, // Base max for text-to-batch
    maxImagesWithSingleRef: 14, // Max when 1 reference image
    maxImagesConstraint: 15, // Total: input refs + output images <= 15
  },
} as const;

/**
 * Default parameter values for Seedream 4.5
 */
export const DEFAULTS = {
  size: '2048x2048',
  quality: 'standard' as Quality,
  responseFormat: 'b64_json' as ResponseFormat, // Use b64_json for simpler display
  stream: false,
  watermark: false,
  sequentialImageGeneration: 'disabled' as const,
  model: 'seedream-4-5-251128' as const, // Seedream 4.5
  batchMode: false,
  maxImages: 15,
} as const;

/**
 * Placeholder prompts for different modes
 */
export const PLACEHOLDER_PROMPTS = {
  text: 'Describe the image you want to generate...',
  image: 'Describe how to transform the reference image...',
  'multi-image': 'Describe how to blend the reference images...',
  'multi-batch': 'Describe the variations to generate from reference images (e.g., "Generate 3 images with different lighting: morning, noon, night")...',
} as const;
