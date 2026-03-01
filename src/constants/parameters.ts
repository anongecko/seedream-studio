import type { Quality, SeedreamModel } from '@/types/api';
import { getModelById } from '@/lib/model-registry';

/**
 * Model-agnostic parameter constraints (not model-specific).
 * Model-specific data (imageUrl, size) lives in the registry.
 */
export const PARAMETER_CONSTRAINTS = {
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

/**
 * Get model-specific constraints (delegates to registry).
 * Same signature as before — downstream callers unchanged.
 */
export const getModelConstraints = (model: SeedreamModel) => {
  const entry = getModelById(model);
  return {
    imageUrl: entry.imageConstraints!,
    size: entry.sizeConstraints!,
  };
};

/**
 * Get model-specific defaults (delegates to registry).
 * Same signature as before — downstream callers unchanged.
 */
export const getModelDefaults = (model: SeedreamModel) => {
  return getModelById(model).defaults!;
};

/**
 * Placeholder prompts for different modes
 */
export const PLACEHOLDER_PROMPTS = {
  text: 'Describe the image you want to generate...',
  image: 'Describe how to transform the reference image...',
  'multi-image': 'Describe how to blend the reference images...',
  'multi-batch': 'Describe the variations to generate from reference images (e.g., "Generate 3 images with different lighting: morning, noon, night")...',
} as const;
