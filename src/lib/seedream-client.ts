import { supabase } from './supabase/client';
import type {
  SeedreamRequest,
  SeedreamResponse,
  SeedreamError,
  GenerationMode,
  Quality,
  ResponseFormat,
  SeedreamModel,
} from '@/types/api';
import { getModelDefaults, getModelConstraints } from '@/constants/parameters';
import {
  getModelById,
  getModelByWireId,
  buildQualityParam,
  extractQualityFromRequest,
} from '@/lib/model-registry';

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
      process.env.NEXT_PUBLIC_SEEDREAM_API_URL || 'https://ark.ap-southeast.bytepluses.com/api/v3';
  }

  /**
   * Generate image(s) using Seedream API
   * Supports both single and batch generation
   * Automatically saves metadata to Supabase on success
   */
  async generate(params: {
    prompt: string;
    mode: GenerationMode;
    model: SeedreamModel;
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
      // Call through Next.js API route (uses node:https with TCP keepalive
      // to handle long-running batch generations without connection drops)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          ...request,
        }),
        signal: AbortSignal.timeout(900_000), // 15 minute timeout for large batch generations
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Generation failed`;
        try {
          const errorData: SeedreamError = await response.json();
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // Response body wasn't valid JSON, use status-based message
        }
        throw new Error(errorMessage);
      }

      const result: SeedreamResponse = await response.json();
      const generationTime = Date.now() - startTime;

      // Save to Supabase (default: true)
      if (params.saveToDatabase !== false) {
        await this.saveToDatabase(request, result, generationTime, params.mode, params.model);
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
   * Handles model-specific parameter mapping
   */
  private buildRequest(params: {
    prompt: string;
    mode: GenerationMode;
    model: SeedreamModel;
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

    const defaults = getModelDefaults(params.model);
    const modelEntry = getModelById(params.model);

    const request: SeedreamRequest = {
      model: modelEntry.wireModelId as SeedreamRequest['model'],
      prompt: params.prompt,
      image: imageInput,
      size: params.size || defaults.size,
      sequential_image_generation: params.batchMode ? 'auto' : 'disabled',
      response_format: params.responseFormat || defaults.responseFormat,
      stream: defaults.stream,
      watermark: defaults.watermark,
    };

    // Model-specific quality parameter handling via registry
    Object.assign(request, buildQualityParam(params.model, params.quality || defaults.quality));

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
    // Determine model from request
    const model: SeedreamModel = getModelByWireId(request.model).id as SeedreamModel;
    const constraints = getModelConstraints(model);

    // Validate prompt
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new Error('Prompt is required and cannot be empty');
    }

    // Validate image count based on model
    if (request.image) {
      const images = Array.isArray(request.image) ? request.image : [request.image];
      if (images.length > constraints.imageUrl.maxCount) {
        throw new Error(
          `Maximum ${constraints.imageUrl.maxCount} reference images allowed for ${model}`
        );
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
      const images = request.image
        ? Array.isArray(request.image)
          ? request.image
          : [request.image]
        : [];
      const inputCount = images.length;

      if (inputCount === 1 && maxImages > 14) {
        throw new Error('With 1 reference image, max_images cannot exceed 14');
      }
      if (inputCount > 1 && inputCount + maxImages > 15) {
        throw new Error(
          `With ${inputCount} reference images, max_images cannot exceed ${15 - inputCount}`
        );
      }
    }

    // Validate size format
    if (request.size && !this.isValidSize(request.size, model)) {
      const constraints = getModelConstraints(model);
      const presets = constraints.size.presets.join(', ');
      throw new Error(
        `Invalid size format for ${model}. Use presets (${presets}) or WIDTHxHEIGHT with minimum ${constraints.size.minTotalPixels} pixels`
      );
    }
  }

  /**
   * Validate size parameter format based on model
   */
  private isValidSize(size: string, model: SeedreamModel): boolean {
    const constraints = getModelConstraints(model);

    // Check if it's a preset
    if (constraints.size.presets.includes(size)) {
      return true;
    }

    // Check if it's WIDTHxHEIGHT format
    const match = size.match(/^(\d+)x(\d+)$/);
    if (!match) {
      return false;
    }

    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);

    // Validate total pixels
    const totalPixels = width * height;
    if (
      totalPixels < constraints.size.minTotalPixels ||
      totalPixels > constraints.size.maxTotalPixels
    ) {
      return false;
    }

    // Validate aspect ratio
    const aspectRatio = width / height;
    if (
      aspectRatio < constraints.size.aspectRatioRange.min ||
      aspectRatio > constraints.size.aspectRatioRange.max
    ) {
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
    generationTime: number,
    originalMode: GenerationMode,
    model: SeedreamModel
  ): Promise<void> {
    try {
      // Determine mode from request
      const images = request.image
        ? Array.isArray(request.image)
          ? request.image
          : [request.image]
        : [];

      // Use original mode if provided (for multi-batch vs multi-image distinction)
      // Otherwise infer from request structure
      let mode: GenerationMode;
      if (originalMode) {
        mode = originalMode;
      } else {
        mode = images.length === 0 ? 'text' : images.length === 1 ? 'image' : 'multi-image';
      }

      // Insert generation record with metadata only (NO IMAGES)
      const { error } = await supabase.from('generations').insert({
        prompt: request.prompt,
        mode,
        reference_image_urls: images.length > 0 ? images : null,
        size: request.size || '2048x2048',
        quality: extractQualityFromRequest(model, request as unknown as Record<string, unknown>),
        batch_mode: request.sequential_image_generation === 'auto',
        max_images: request.sequential_image_generation_options?.max_images || null,
        images_generated: response.data.length,
        generation_time_ms: generationTime,
        model_version: response.model,
      });

      if (error) {
        console.error('Failed to save generation to database:', error);
        // Don't throw - generation succeeded, DB save is secondary
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      // Don't throw - generation succeeded, DB save is secondary
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
