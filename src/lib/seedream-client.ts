import { supabase } from './supabase/client';
import type {
  SeedreamRequest,
  SeedreamResponse,
  SeedreamError,
  GenerationMode,
  Quality,
  ResponseFormat,
} from '@/types/api';
import { DEFAULTS } from '@/constants/parameters';

/**
 * Seedream API client with Supabase integration
 * Handles image generation and automatic metadata persistence
 */
export class SeedreamClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl =
      process.env.NEXT_PUBLIC_SEEDREAM_API_URL ||
      'https://ark.ap-southeast.bytepluses.com/api/v3';
  }

  /**
   * Generate image(s) using Seedream API
   * Supports both single and batch generation
   * Automatically saves metadata to Supabase on success
   */
  async generate(params: {
    prompt: string;
    mode: GenerationMode;
    images?: string[];
    size?: string;
    quality?: Quality;
    batchMode?: boolean;
    maxImages?: number;
    responseFormat?: ResponseFormat;
    saveToDatabase?: boolean; // Default: true
  }): Promise<SeedreamResponse> {
    const startTime = Date.now();

    // Build request with defaults
    const request = this.buildRequest(params);

    // Validate request
    this.validateRequest(request);

    try {
      // Make API call through Next.js API route to avoid CORS issues
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          ...request,
        }),
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      });

      if (!response.ok) {
        const errorData: SeedreamError = await response.json();
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: Generation failed`
        );
      }

      const result: SeedreamResponse = await response.json();
      const generationTime = Date.now() - startTime;

      // Save to Supabase (default: true)
      if (params.saveToDatabase !== false) {
        await this.saveToDatabase(request, result, generationTime);
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          throw new Error('Generation timed out. Please try again.');
        }
        throw error;
      }
      throw new Error('An unknown error occurred during generation');
    }
  }

  /**
   * Build complete request with defaults and proper formatting
   */
  private buildRequest(params: {
    prompt: string;
    mode: GenerationMode;
    images?: string[];
    size?: string;
    quality?: Quality;
    batchMode?: boolean;
    maxImages?: number;
    responseFormat?: ResponseFormat;
  }): SeedreamRequest {
    // Format image input based on mode
    let imageInput: string | string[] | undefined;
    if (params.images && params.images.length > 0) {
      imageInput = params.images.length === 1 ? params.images[0] : params.images;
    }

    const request: SeedreamRequest = {
      model: DEFAULTS.model,
      prompt: params.prompt,
      image: imageInput,
      size: params.size || DEFAULTS.size,
      quality: params.quality || DEFAULTS.quality,
      sequential_image_generation: params.batchMode ? 'auto' : 'disabled',
      response_format: params.responseFormat || DEFAULTS.responseFormat,
      stream: DEFAULTS.stream,
      watermark: DEFAULTS.watermark,
    };

    // Add batch options if batch mode enabled
    if (params.batchMode && params.maxImages) {
      request.sequential_image_generation_options = {
        max_images: params.maxImages,
      };
    }

    return request;
  }

  /**
   * Validate request parameters before sending
   */
  private validateRequest(request: SeedreamRequest): void {
    // Validate prompt
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required and cannot be empty');
    }

    // Validate image count
    if (request.image) {
      const images = Array.isArray(request.image) ? request.image : [request.image];
      if (images.length > 10) {
        throw new Error('Maximum 10 reference images allowed');
      }
      if (images.length < 1) {
        throw new Error('At least 1 reference image required when using image mode');
      }
    }

    // Validate batch parameters
    if (request.sequential_image_generation === 'auto') {
      const maxImages = request.sequential_image_generation_options?.max_images;
      if (!maxImages || maxImages < 1 || maxImages > 15) {
        throw new Error('max_images must be between 1 and 15 for batch generation');
      }

      // Validate against mode constraints
      const images = request.image ? (Array.isArray(request.image) ? request.image : [request.image]) : [];
      const inputCount = images.length;

      if (inputCount === 1 && maxImages > 14) {
        throw new Error('With 1 reference image, max_images cannot exceed 14');
      }
      if (inputCount > 1 && (inputCount + maxImages) > 15) {
        throw new Error(`With ${inputCount} reference images, max_images cannot exceed ${15 - inputCount}`);
      }
    }

    // Validate size format
    if (request.size && !this.isValidSize(request.size)) {
      throw new Error(
        'Invalid size format. Use presets (1K, 2K, 4K) or WIDTHxHEIGHT (e.g., 2048x2048)'
      );
    }
  }

  /**
   * Validate size parameter format
   */
  private isValidSize(size: string): boolean {
    // Check if it's a preset
    if (['1K', '2K', '4K'].includes(size)) {
      return true;
    }

    // Check if it's WIDTHxHEIGHT format
    const match = size.match(/^(\d+)x(\d+)$/);
    if (!match) {
      return false;
    }

    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);

    // Validate dimensions
    if (width < 1280 || width > 4096 || height < 720 || height > 4096) {
      return false;
    }

    // Validate aspect ratio
    const aspectRatio = width / height;
    if (aspectRatio < 1 / 16 || aspectRatio > 16) {
      return false;
    }

    return true;
  }

  /**
   * Save generation metadata to Supabase (images NOT stored)
   * Stores only metadata - images are displayed immediately from API response
   */
  private async saveToDatabase(
    request: SeedreamRequest,
    response: SeedreamResponse,
    generationTime: number
  ): Promise<void> {
    try {
      // Determine mode from request
      const images = request.image
        ? Array.isArray(request.image)
          ? request.image
          : [request.image]
        : [];

      const mode: GenerationMode =
        images.length === 0 ? 'text' : images.length === 1 ? 'image' : 'multi-image';

      // Insert generation record with metadata only (NO IMAGES)
      // Cast to any to bypass Supabase type inference (migration will update schema)
      const { error } = await supabase.from('generations').insert([
        {
          prompt: request.prompt,
          mode,
          reference_image_urls: images.length > 0 ? images : null,
          size: request.size || DEFAULTS.size,
          quality: request.quality || DEFAULTS.quality,
          batch_mode: request.sequential_image_generation === 'auto',
          max_images: request.sequential_image_generation_options?.max_images || null,
          images_generated: response.data.length, // Store count only
          generation_time_ms: generationTime,
          model_version: response.model,
        } as any,
      ]);

      if (error) {
        console.error('Failed to save generation to database:', error);
        // Don't throw - generation succeeded, DB save is secondary
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      // Don't throw - generation succeeded, DB save is secondary
    }
  }

  /**
   * Test API key validity
   * Makes a minimal generation request to verify the key works
   */
  async testApiKey(): Promise<boolean> {
    try {
      await this.generate({
        prompt: 'test',
        mode: 'text',
        size: '1K',
        quality: 'fast',
        saveToDatabase: false, // Don't save test generations
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Singleton instance management
 * Reuses client when API key hasn't changed
 */
let cachedClient: SeedreamClient | null = null;
let cachedApiKey: string | null = null;

export function getSeedreamClient(apiKey: string): SeedreamClient {
  if (cachedClient && cachedApiKey === apiKey) {
    return cachedClient;
  }

  cachedClient = new SeedreamClient(apiKey);
  cachedApiKey = apiKey;
  return cachedClient;
}
