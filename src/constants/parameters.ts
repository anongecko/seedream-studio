import type { Quality, SizePreset, ResponseFormat, SeedreamModel } from '@/types/api';

/**
 * Model-specific parameter constraints
 */
export const PARAMETER_CONSTRAINTS = {
  // Image URL constraints (varies by model)
  imageUrl: {
    'seedream-4-0': {
      maxCount: 10, // Max 10 reference images
      formats: ['jpeg', 'jpg', 'png'], // Limited formats
      maxSize: 10 * 1024 * 1024, // 10 MB
      aspectRatio: { min: 1 / 3, max: 3 }, // [1/3, 3]
      minDimension: 14,
      maxTotalPixels: 6000 * 6000,
    },
    'seedream-4-5': {
      maxCount: 14, // Max 14 reference images
      formats: ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'tiff', 'gif'], // Expanded format support
      maxSize: 10 * 1024 * 1024, // 10 MB
      aspectRatio: { min: 1 / 16, max: 16 }, // [1/16, 16]
      minDimension: 14,
      maxTotalPixels: 6000 * 6000,
    },
  } as const,

  // Size constraints (varies by model)
  size: {
    'seedream-4-0': {
      presets: ['1K', '2K', '4K'] as const,
      customRange: {
        min: { width: 1280, height: 720 }, // Lower minimum
        max: { width: 4096, height: 4096 },
      },
      minTotalPixels: 1280 * 720, // 921,600 pixels minimum
      maxTotalPixels: 4096 * 4096, // 16,777,216 pixels maximum
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
    'seedream-4-5': {
      presets: ['2K', '4K'] as const, // No '1K' preset
      customRange: {
        min: { width: 2560, height: 1440 }, // Higher minimum
        max: { width: 4096, height: 4096 },
      },
      minTotalPixels: 2560 * 1440, // 3,686,400 pixels minimum
      maxTotalPixels: 4096 * 4096, // 16,777,216 pixels maximum
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
  } as const,

  // Quality options (same for both models but different parameter names)
  quality: {
    options: ['standard', 'fast'] as const,
    descriptions: {
      standard: 'Higher quality, longer generation time',
      fast: 'Faster generation, average quality',
    },
  },

  // Batch generation constraints (same for both models)
  batch: {
    maxImagesBase: 15, // Base max for text-to-batch
    maxImagesWithSingleRef: 14, // Max when 1 reference image
    maxImagesConstraint: 15, // Total: input refs + output images <= 15
  },
} as const;

// Helper function to get constraints for a specific model
export const getModelConstraints = (model: SeedreamModel) => ({
  imageUrl: PARAMETER_CONSTRAINTS.imageUrl[model],
  size: PARAMETER_CONSTRAINTS.size[model],
});

/**
 * Model-specific default parameter values
 */
export const DEFAULTS = {
  'seedream-4-0': {
    size: '2048x2048',
    quality: 'standard' as Quality,
    responseFormat: 'b64_json' as ResponseFormat,
    stream: false,
    watermark: false,
    sequentialImageGeneration: 'disabled' as const,
    batchMode: false,
    maxImages: 15,
  },
  'seedream-4-5': {
    size: '2048x2048',
    quality: 'standard' as Quality,
    responseFormat: 'b64_json' as ResponseFormat,
    stream: false,
    watermark: false,
    sequentialImageGeneration: 'disabled' as const,
    batchMode: false,
    maxImages: 15,
  },
} as const;

// Helper to get defaults for a model
export const getModelDefaults = (model: SeedreamModel) => DEFAULTS[model];

/**
 * Placeholder prompts for different modes
 */
export const PLACEHOLDER_PROMPTS = {
  text: 'Describe the image you want to generate...',
  image: 'Describe how to transform the reference image...',
  'multi-image': 'Describe how to blend the reference images...',
  'multi-batch': 'Describe the variations to generate from reference images (e.g., "Generate 3 images with different lighting: morning, noon, night")...',
} as const;
