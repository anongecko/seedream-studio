import type { GenerationMode, Quality } from '@/lib/supabase/types';

export type { GenerationMode, Quality };

// Model selection
export type SeedreamModel = 'seedream-4-0' | 'seedream-4-5';
export type ModelVersion = 'seedream-4-0-250828' | 'seedream-4-5-251128';

// Size presets (model-specific)
export type SizePreset4 = '1K' | '2K' | '4K'; // Seedream 4.0
export type SizePreset45 = '2K' | '4K'; // Seedream 4.5 (no 1K)
export type SizePreset = SizePreset4 | SizePreset45;

export type ResponseFormat = 'url' | 'b64_json';

// Quality parameters (model-specific)
export type QualityMode = 'standard' | 'fast'; // Seedream 4.0 uses 'quality'
export type OptimizePromptMode = 'standard' | 'fast'; // Seedream 4.5 uses 'optimize_prompt_options'

/**
 * Seedream API request payload (supports both 4.0 and 4.5)
 * Supports 4 generation modes:
 * - Text to Image: no image field, single or batch output
 * - Image to Image: image as single string, single or batch output
 * - Multi-Image Blending: image as array of 2-10/14 strings, single output (disabled batch)
 * - Multi-Image to Batch: image as array of 2-10/14 strings, batch output (auto batch)
 *
 * Batch generation: Set sequential_image_generation to "auto" and provide sequential_image_generation_options
 * Constraint for batch: input images + output images <= 15
 */
export interface SeedreamRequest {
  model: ModelVersion;
  prompt: string;
  image?: string | string[]; // undefined for text-to-image, string for image-to-image, array for multi-image
  size?: SizePreset | string; // Constraints vary by model
  // Model-specific parameters
  quality?: QualityMode; // Seedream 4.0 only
  optimize_prompt_options?: {
    mode: OptimizePromptMode; // Seedream 4.5 only
  };
  sequential_image_generation: 'disabled' | 'auto'; // 'auto' for batch generation
  sequential_image_generation_options?: {
    max_images: number; // Range: 1-15, adjusted based on input images
  };
  response_format?: ResponseFormat; // Default: "b64_json" for immediate display
  stream: false; // Always false
  watermark: false; // Always false
}

/**
 * Seedream API response
 * Contains generated image data and usage metadata
 */
export interface SeedreamResponse {
  model: string;
  created: number;
  data: SeedreamImageData[];
  usage: {
    generated_images: number;
    output_tokens: number;
    total_tokens: number;
  };
}

/**
 * Individual image data in response
 * Contains either b64_json or url depending on response_format
 */
export interface SeedreamImageData {
  b64_json?: string; // Base64 image data (if response_format: "b64_json")
  url?: string; // Download URL (if response_format: "url", valid for 24 hours)
  size: string; // e.g., "1760x2368"
}

/**
 * Client-side generation result with image data
 * Used for displaying and managing generated images in UI
 * Supports both single and batch (multiple images)
 */
export interface GenerationResult {
  id: string;
  images: Array<{ // Changed from single imageBase64 to array
    base64: string;
    size: string; // e.g., "1760x2368"
  }>;
  prompt: string;
  mode: GenerationMode;
  model: SeedreamModel; // Track which model was used
  referenceImageUrls?: string[]; // Base64 strings or URLs used as references
  parameters: {
    size: string;
    quality: Quality; // Maps to optimize_prompt_options.mode or quality parameter
    batchMode: boolean;
    maxImages?: number; // Only when batchMode is true
  };
  generationTimeMs: number;
  timestamp: Date;
}

/**
 * API error response
 */
export interface SeedreamError {
  error: {
    message: string;
    type: string;
    code: string;
  };
}
