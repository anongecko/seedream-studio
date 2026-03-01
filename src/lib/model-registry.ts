/**
 * Central Model Registry — single source of truth for all model configuration.
 *
 * IMPORTANT: This file has ZERO imports from project files.
 * It is a leaf-level module to avoid circular dependencies.
 * All other files import FROM here, never the reverse.
 */

// ============================================================================
// Types
// ============================================================================

export type MediaType = 'image' | 'video';
export type Quality = 'standard' | 'fast';
export type ResponseFormat = 'url' | 'b64_json';

export interface ImageConstraints {
  maxCount: number;
  formats: readonly string[];
  maxSize: number;
  aspectRatio: { min: number; max: number };
  minDimension: number;
  maxTotalPixels: number;
}

export interface SizeDimensionEntry {
  label: string;
  ratio: string;
  dimensions: string; // API format: "2048x2048"
  displayDimensions: string; // UI format: "2048×2048"
  aspectRatio: number;
  category: 'square' | 'landscape' | 'portrait';
}

export interface SizeConstraints {
  presets: readonly string[];
  customRange: {
    min: { width: number; height: number };
    max: { width: number; height: number };
  };
  minTotalPixels: number;
  maxTotalPixels: number;
  aspectRatioRange: { min: number; max: number };
  tierDimensions: Record<string, SizeDimensionEntry[]>;
}

export interface ModelDefaults {
  size: string;
  quality: Quality;
  responseFormat: ResponseFormat;
  stream: false;
  watermark: false;
  sequentialImageGeneration: 'disabled';
  batchMode: false;
  maxImages: number;
}

export interface ModelRegistryEntry {
  // Identity
  id: string;
  wireModelId: string;
  mediaType: MediaType;

  // Display
  label: string;
  displayName: string; // e.g., "4.0", "4.5", "1.5 Pro"
  displayLabel: string; // e.g., "4.0 Uncensored", "4.5 Censored"
  description: string;
  badgeText: string;

  // Theme
  color: string;
  badgeColor: string;

  // Flags
  isDefault: boolean;
  isCensored: boolean;
  supportsCustomModelId: boolean;

  // API behavior
  qualityParamName: 'quality' | 'optimize_prompt_options';

  // Constraints (null for non-image models)
  imageConstraints: ImageConstraints | null;
  sizeConstraints: SizeConstraints | null;

  // Defaults (null for non-image models)
  defaults: ModelDefaults | null;
}

// ============================================================================
// Dimension Helpers (private)
// ============================================================================

function dim(
  label: string,
  ratio: string,
  w: number,
  h: number,
  category: 'square' | 'landscape' | 'portrait'
): SizeDimensionEntry {
  return {
    label,
    ratio,
    dimensions: `${w}x${h}`,
    displayDimensions: `${w}×${h}`,
    aspectRatio: w / h,
    category,
  };
}

// ============================================================================
// Tier Dimension Data
// ============================================================================

const ASPECT_RATIO_SEEDS = [
  {
    label: '1:1',
    ratio: 'Square',
    category: 'square' as const,
    tiers: { '1K': [1024, 1024], '2K': [2048, 2048], '4K': [4096, 4096] },
  },
  {
    label: '16:9',
    ratio: 'Wide',
    category: 'landscape' as const,
    tiers: { '1K': [1280, 720], '2K': [2560, 1440], '4K': [3840, 2160] },
  },
  {
    label: '4:3',
    ratio: 'Landscape',
    category: 'landscape' as const,
    tiers: { '1K': [1152, 864], '2K': [2304, 1728], '4K': [3840, 2880] },
  },
  {
    label: '3:2',
    ratio: 'Classic',
    category: 'landscape' as const,
    tiers: { '1K': [1248, 832], '2K': [2496, 1664], '4K': [3840, 2560] },
  },
  {
    label: '21:9',
    ratio: 'Ultrawide',
    category: 'landscape' as const,
    tiers: { '1K': [1512, 648], '2K': [3024, 1296], '4K': [4096, 1760] },
  },
  {
    label: '9:16',
    ratio: 'Tall',
    category: 'portrait' as const,
    tiers: { '1K': [720, 1280], '2K': [1440, 2560], '4K': [2160, 3840] },
  },
  {
    label: '3:4',
    ratio: 'Portrait',
    category: 'portrait' as const,
    tiers: { '1K': [864, 1152], '2K': [1728, 2304], '4K': [2880, 3840] },
  },
  {
    label: '2:3',
    ratio: 'Photo',
    category: 'portrait' as const,
    tiers: { '1K': [832, 1248], '2K': [1664, 2496], '4K': [2560, 3840] },
  },
] as const;

function buildTierDimensions(tierNames: readonly string[]): Record<string, SizeDimensionEntry[]> {
  const result: Record<string, SizeDimensionEntry[]> = {};
  for (const tier of tierNames) {
    result[tier] = ASPECT_RATIO_SEEDS.map((seed) => {
      const [w, h] = seed.tiers[tier as keyof typeof seed.tiers];
      return dim(seed.label, seed.ratio, w, h, seed.category);
    });
  }
  return result;
}

const SEEDREAM_40_TIERS = buildTierDimensions(['1K', '2K', '4K']);
const SEEDREAM_45_TIERS = buildTierDimensions(['2K', '4K']);

// ============================================================================
// Registry
// ============================================================================

export const MODEL_REGISTRY: readonly ModelRegistryEntry[] = [
  {
    id: 'seedream-4-5',
    wireModelId: 'seedream-4-5-251128',
    mediaType: 'image',
    label: '4.5',
    displayName: '4.5',
    displayLabel: '4.5 Censored',
    description: 'Censored',
    badgeText: 'Content filtered',
    color: 'from-blue-500 to-purple-500',
    badgeColor: 'border-blue-500/50 text-blue-600 dark:text-blue-400',
    isDefault: true,
    isCensored: true,
    supportsCustomModelId: false,
    qualityParamName: 'optimize_prompt_options',
    imageConstraints: {
      maxCount: 14,
      formats: ['jpeg', 'jpg', 'png', 'webp', 'bmp', 'tiff', 'gif'],
      maxSize: 10 * 1024 * 1024,
      aspectRatio: { min: 1 / 16, max: 16 },
      minDimension: 14,
      maxTotalPixels: 6000 * 6000,
    },
    sizeConstraints: {
      presets: ['2K', '4K'],
      customRange: {
        min: { width: 2560, height: 1440 },
        max: { width: 4096, height: 4096 },
      },
      minTotalPixels: 2560 * 1440,
      maxTotalPixels: 4096 * 4096,
      aspectRatioRange: { min: 1 / 16, max: 16 },
      tierDimensions: SEEDREAM_45_TIERS,
    },
    defaults: {
      size: '2048x2048',
      quality: 'standard',
      responseFormat: 'b64_json',
      stream: false,
      watermark: false,
      sequentialImageGeneration: 'disabled',
      batchMode: false,
      maxImages: 15,
    },
  },
  {
    id: 'seedream-4-0',
    wireModelId: 'seedream-4-0-250828',
    mediaType: 'image',
    label: '4.0',
    displayName: '4.0',
    displayLabel: '4.0 Uncensored',
    description: 'Uncensored',
    badgeText: 'No restrictions',
    color: 'from-red-500 to-orange-500',
    badgeColor: 'border-orange-500/50 text-orange-600 dark:text-orange-400',
    isDefault: false,
    isCensored: false,
    supportsCustomModelId: false,
    qualityParamName: 'quality',
    imageConstraints: {
      maxCount: 10,
      formats: ['jpeg', 'jpg', 'png'],
      maxSize: 10 * 1024 * 1024,
      aspectRatio: { min: 1 / 3, max: 3 },
      minDimension: 14,
      maxTotalPixels: 6000 * 6000,
    },
    sizeConstraints: {
      presets: ['1K', '2K', '4K'],
      customRange: {
        min: { width: 1280, height: 720 },
        max: { width: 4096, height: 4096 },
      },
      minTotalPixels: 1280 * 720,
      maxTotalPixels: 4096 * 4096,
      aspectRatioRange: { min: 1 / 16, max: 16 },
      tierDimensions: SEEDREAM_40_TIERS,
    },
    defaults: {
      size: '2048x2048',
      quality: 'standard',
      responseFormat: 'b64_json',
      stream: false,
      watermark: false,
      sequentialImageGeneration: 'disabled',
      batchMode: false,
      maxImages: 15,
    },
  },
  {
    id: 'seedance-1-5-pro',
    wireModelId: 'seedance-1-5-pro',
    mediaType: 'video',
    label: 'Dance 1.5',
    displayName: '1.5 Pro',
    displayLabel: 'Seedance 1.5 Pro',
    description: 'Video',
    badgeText: 'Video + Audio',
    color: 'from-green-500 to-teal-500',
    badgeColor: 'border-green-500/50 text-green-600 dark:text-green-400',
    isDefault: false,
    isCensored: false,
    supportsCustomModelId: true,
    qualityParamName: 'quality', // not applicable to video, placeholder
    imageConstraints: null,
    sizeConstraints: null,
    defaults: null,
  },
] as const;

// ============================================================================
// Derived Types
// ============================================================================

// Manually defined to avoid const-assertion extraction issues
// with the ModelRegistryEntry interface
export type ModelId = 'seedream-4-5' | 'seedream-4-0' | 'seedance-1-5-pro';
export type ImageModelId = 'seedream-4-5' | 'seedream-4-0';
export type WireModelId = 'seedream-4-5-251128' | 'seedream-4-0-250828' | 'seedance-1-5-pro';

// ============================================================================
// Lookup Functions
// ============================================================================

export function getModelById(id: string): ModelRegistryEntry {
  const entry = MODEL_REGISTRY.find((m) => m.id === id);
  if (!entry) throw new Error(`Unknown model ID: ${id}`);
  return entry;
}

export function getModelByWireId(wireId: string): ModelRegistryEntry {
  const entry = MODEL_REGISTRY.find((m) => m.wireModelId === wireId);
  if (!entry) throw new Error(`Unknown wire model ID: ${wireId}`);
  return entry;
}

export function getAllModels(): readonly ModelRegistryEntry[] {
  return MODEL_REGISTRY;
}

export function getImageModels(): ModelRegistryEntry[] {
  return MODEL_REGISTRY.filter((m) => m.mediaType === 'image') as ModelRegistryEntry[];
}

export function getVideoModels(): ModelRegistryEntry[] {
  return MODEL_REGISTRY.filter((m) => m.mediaType === 'video') as ModelRegistryEntry[];
}

export function getDefaultModel(): ModelRegistryEntry {
  return MODEL_REGISTRY.find((m) => m.isDefault) || MODEL_REGISTRY[0];
}

export function getDefaultImageModel(): ModelRegistryEntry {
  return getImageModels().find((m) => m.isDefault) || getImageModels()[0];
}

export function isValidModelId(id: string): id is ModelId {
  return MODEL_REGISTRY.some((m) => m.id === id);
}

// ============================================================================
// Quality Parameter Helpers
// ============================================================================

/**
 * Build the model-specific quality parameter for an API request.
 * Seedream 4.0 → { quality: "standard" }
 * Seedream 4.5 → { optimize_prompt_options: { mode: "standard" } }
 */
export function buildQualityParam(modelId: string, quality: Quality): Record<string, unknown> {
  const entry = getModelById(modelId);
  if (entry.qualityParamName === 'optimize_prompt_options') {
    return { optimize_prompt_options: { mode: quality } };
  }
  return { quality };
}

/**
 * Extract quality value from a raw API request, regardless of model.
 */
export function extractQualityFromRequest(
  modelId: string,
  request: Record<string, unknown>
): Quality {
  const entry = getModelById(modelId);
  if (entry.qualityParamName === 'optimize_prompt_options') {
    const opts = request.optimize_prompt_options as { mode?: string } | undefined;
    return (opts?.mode as Quality) || 'standard';
  }
  return (request.quality as Quality) || 'standard';
}

// ============================================================================
// Tier Helpers
// ============================================================================

export function getAvailableTiers(modelId: string): string[] {
  const entry = getModelById(modelId);
  if (!entry.sizeConstraints) return [];
  return Object.keys(entry.sizeConstraints.tierDimensions);
}

export function getDimensionsForTier(modelId: string, tier: string): SizeDimensionEntry[] {
  const entry = getModelById(modelId);
  if (!entry.sizeConstraints) return [];
  return entry.sizeConstraints.tierDimensions[tier] || [];
}
