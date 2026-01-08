/**
 * Seedance 1.5 Pro video generation API client
 *
 * Video generation uses an async task-based API:
 * 1. Create task → Returns task ID immediately
 * 2. Poll status → Exponential backoff until succeeded/failed
 * 3. Get video URL → Download URL valid for 24 hours
 */

import { supabase } from './supabase/client';
import type {
  VideoGenerationRequest,
  VideoGenerationResponse,
  VideoTaskResponse,
  VideoTaskStatus,
  VideoMode,
  VideoError,
  VideoContent,
  VideoContentText,
  VideoContentImage,
  VideoImageInput,
  VideoDuration,
  VideoResolution,
  VideoRatio,
  VideoServiceTier,
} from '@/types/video-api';
import { isTerminalStatus, isSuccessStatus } from '@/types/video-api';
import { VIDEO_CONSTRAINTS, buildTextCommands, validateImageCount } from '@/constants/video-parameters';

/**
 * Seedance video generation client with async task polling
 */
export class SeedanceClient {
  private apiKey: string;
  private baseUrl: string;
  private modelId: string;

  constructor(apiKey: string, modelId?: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key is required');
    }
    this.apiKey = apiKey;
    this.baseUrl =
      process.env.NEXT_PUBLIC_SEEDREAM_API_URL ||
      'https://ark.ap-southeast.bytepluses.com/api/v3';
    this.modelId = modelId || 'seedance-1-5-pro';
  }

  /**
   * Create a video generation task
   * Returns immediately with task ID for polling
   */
  async createTask(params: {
    prompt: string;
    mode: VideoMode;
    images?: VideoImageInput[];
    duration?: VideoDuration;
    resolution?: VideoResolution;
    ratio?: VideoRatio;
    generateAudio?: boolean;
    serviceTier?: VideoServiceTier;
    returnLastFrame?: boolean;
  }): Promise<{ taskId: string }> {
    // Build and validate request
    const request = this.buildRequest(params);
    this.validateRequest(request, params.mode);

    // Make API call through Next.js proxy
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: this.apiKey,
        ...request,
      }),
    });

    if (!response.ok) {
      const error: VideoError = await response.json();
      throw new Error(error.error?.message || 'Failed to create video task');
    }

    const result: VideoGenerationResponse = await response.json();
    return { taskId: result.id };
  }

  /**
   * Poll task status until completion or failure
   * Uses exponential backoff: 2s → 4s → 8s → 10s (capped)
   *
   * @param taskId - The video generation task ID
   * @param onProgress - Callback for status updates
   * @param timeoutMs - Maximum time to wait (default 10 minutes)
   * @param abortSignal - Optional AbortSignal to cancel polling
   */
  async pollTaskStatus(
    taskId: string,
    onProgress?: (status: VideoTaskStatus) => void,
    timeoutMs: number = 600000, // 10 minutes default
    abortSignal?: AbortSignal
  ): Promise<VideoTaskResponse> {
    const startTime = Date.now();
    let attempt = 0;

    while (Date.now() - startTime < timeoutMs) {
      // Check if cancelled
      if (abortSignal?.aborted) {
        throw new Error('Video generation cancelled by user');
      }

      const status = await this.getTaskStatus(taskId);

      // Notify progress callback
      if (onProgress) {
        onProgress(status.status);
      }

      // Check for terminal states
      if (isTerminalStatus(status.status)) {
        if (isSuccessStatus(status.status)) {
          return status;
        }

        // Failed or expired
        if (status.status === 'failed') {
          throw new Error(
            status.error?.message || 'Video generation failed'
          );
        }

        if (status.status === 'expired') {
          throw new Error('Video generation task expired');
        }
      }

      // Exponential backoff: 2s, 4s, 8s, capped at 10s
      const delay = Math.min(2000 * Math.pow(2, attempt), 10000);

      // Wait with cancellation support
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(resolve, delay);

        // Cancel handler
        if (abortSignal) {
          abortSignal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new Error('Video generation cancelled by user'));
          }, { once: true });
        }
      });

      attempt++;
    }

    throw new Error('Video generation timed out');
  }

  /**
   * Get current task status (single poll)
   */
  async getTaskStatus(taskId: string): Promise<VideoTaskResponse> {
    const response = await fetch(`/api/generate-video/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get task status');
    }

    return await response.json();
  }

  /**
   * Generate video and wait for completion
   * Convenience method that combines create + poll
   *
   * @param params - Video generation parameters
   * @param onProgress - Optional progress callback
   * @param abortSignal - Optional AbortSignal to cancel generation
   */
  async generate(
    params: Parameters<typeof this.createTask>[0],
    onProgress?: (status: VideoTaskStatus) => void,
    abortSignal?: AbortSignal
  ): Promise<VideoTaskResponse> {
    const { taskId } = await this.createTask(params);
    return await this.pollTaskStatus(taskId, onProgress, 600000, abortSignal);
  }

  /**
   * Build video generation request from parameters
   */
  private buildRequest(params: {
    prompt: string;
    mode: VideoMode;
    images?: VideoImageInput[];
    duration?: VideoDuration;
    resolution?: VideoResolution;
    ratio?: VideoRatio;
    generateAudio?: boolean;
    serviceTier?: VideoServiceTier;
    returnLastFrame?: boolean;
  }): VideoGenerationRequest {
    const content: VideoContent[] = [];

    // Build text content with optional text commands
    let textContent = params.prompt;

    // Append text commands if parameters differ from defaults
    const textCommands = buildTextCommands({
      ratio: params.ratio,
      duration: params.duration,
      resolution: params.resolution,
    });

    if (textCommands) {
      textContent = textContent + textCommands;
    }

    content.push({
      type: 'text',
      text: textContent,
    } as VideoContentText);

    // Add image content based on mode
    if (params.images && params.images.length > 0) {
      params.images.forEach(img => {
        content.push({
          type: 'image_url',
          image_url: { url: img.url },
          role: img.role,
        } as VideoContentImage);
      });
    }

    return {
      model: this.modelId,
      content,
      generate_audio: params.generateAudio ?? true,
      return_last_frame: params.returnLastFrame ?? false,
      service_tier: params.serviceTier ?? 'default',
      execution_expires_after: 172800, // 48 hours
    };
  }

  /**
   * Validate request based on mode
   */
  private validateRequest(request: VideoGenerationRequest, mode: VideoMode): void {
    // Extract images from content
    const images = request.content.filter(
      c => c.type === 'image_url'
    ) as VideoContentImage[];

    // Validate image count
    if (!validateImageCount(mode, images.length)) {
      const constraint = VIDEO_CONSTRAINTS.imageCounts[mode];
      if (typeof constraint === 'number') {
        throw new Error(
          `${mode} requires exactly ${constraint} image${constraint !== 1 ? 's' : ''}`
        );
      } else {
        throw new Error(
          `${mode} requires ${constraint.min}-${constraint.max} images`
        );
      }
    }

    // Validate prompt
    const textContent = request.content.find(c => c.type === 'text');
    if (!textContent || !textContent.text || textContent.text.trim().length === 0) {
      throw new Error('Prompt is required');
    }

    // Validate roles for specific modes
    if (mode === 'image-to-video-frames') {
      const roles = images.map(img => img.role);
      if (!roles.includes('first_frame') || !roles.includes('last_frame')) {
        throw new Error('First + Last Frame mode requires first_frame and last_frame roles');
      }
    }

    if (mode === 'image-to-video-ref') {
      const allRef = images.every(img => img.role === 'reference_image');
      if (!allRef) {
        throw new Error('All images must have reference_image role in Reference Images mode');
      }
    }
  }

  /**
   * Save video metadata to database
   * DISABLED: Videos are session-only (URLs expire in 24 hours, privacy concerns)
   *
   * This method is kept for potential future use but does nothing.
   * Video results are only stored in React state during the session.
   */
  async saveToDatabase(
    request: VideoGenerationRequest,
    response: VideoTaskResponse,
    generationTime: number,
    mode: VideoMode,
    parentTaskId?: string | null
  ): Promise<void> {
    // Intentionally disabled - videos are session-only
    // No database persistence to avoid privacy issues and 24-hour URL expiry problems
    return;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let cachedClient: SeedanceClient | null = null;
let cachedApiKey: string | null = null;
let cachedModelId: string | undefined = undefined;

/**
 * Get or create Seedance client instance
 * Caches client for same API key and model ID
 */
export function getSeedanceClient(apiKey: string, modelId?: string): SeedanceClient {
  if (cachedClient && cachedApiKey === apiKey && cachedModelId === modelId) {
    return cachedClient;
  }
  cachedClient = new SeedanceClient(apiKey, modelId);
  cachedApiKey = apiKey;
  cachedModelId = modelId;
  return cachedClient;
}
