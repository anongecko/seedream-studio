import type { GenerationMode, Quality } from '@/lib/supabase/types';

export type { GenerationMode, Quality };

export type SizePreset = '1K' | '2K' | '4K';
export type ResponseFormat = 'url' | 'b64_json';

/**
 * Seedream API request payload
 * Supports 3 generation modes with single or batch output:
 * - Text to Image: no image field
 * - Image to Image: image as single string
 * - Multi-Image Blending: image as array of 2-10 strings
 *
 * Batch generation: Set sequential_image_generation to "auto" and provide sequential_image_generation_options
 */
export interface SeedreamRequest {
  model: 'seedream-4-0-250828';
  prompt: string;
  image?: string | string[]; // undefined for text-to-image, string for image-to-image, array for multi-image
  size?: SizePreset | string; // Default: "2048x2048"
  quality?: Quality; // Default: "standard"
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
  referenceImageUrls?: string[];
  parameters: {
    size: string;
    quality: Quality;
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
