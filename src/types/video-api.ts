/**
 * Video generation API types for Seedance 1.5 Pro
 *
 * Video generation uses an async task-based API:
 * 1. Create task → Returns task ID immediately
 * 2. Poll task status → Check if queued/running/succeeded/failed
 * 3. Get video URL → Download URL valid for 24 hours
 */

// ============================================================================
// Core Video Types
// ============================================================================

export type MediaType = 'image' | 'video';

// Video generation modes (4 modes)
export type VideoMode =
  | 'text-to-video'           // Just prompt, no images
  | 'image-to-video-first'    // 1 image (first frame only)
  | 'image-to-video-frames'   // 2 images (first + last frame)
  | 'image-to-video-ref';     // 1-4 reference images

// Video parameters
export type VideoDuration = 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | -1; // -1 = auto (model decides)
export type VideoResolution = '480p' | '720p'; // 1080p NOT supported for Seedance 1.5 Pro
export type VideoRatio = '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | 'adaptive';
export type VideoFrameRate = 24; // Only option for Seedance 1.5 Pro
export type VideoServiceTier = 'default' | 'flex'; // Online vs offline mode

// Image roles for video generation
export type VideoImageRole = 'first_frame' | 'last_frame' | 'reference_image';

// Task states during video generation
export type VideoTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'expired';

// ============================================================================
// Request Content Structure
// ============================================================================

/**
 * Text content in video request
 * Contains prompt + optional text commands (--rt, --dur, etc.)
 */
export interface VideoContentText {
  type: 'text';
  text: string; // Prompt with optional --commands
}

/**
 * Image content in video request
 * Can be URL or base64 data URI
 */
export interface VideoContentImage {
  type: 'image_url';
  image_url: {
    url: string; // URL or base64 data URI
  };
  role?: VideoImageRole; // Required for frames/ref modes, optional for first-only
}

export type VideoContent = VideoContentText | VideoContentImage;

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Video generation task creation request
 * POST /api/v3/contents/generations/tasks
 */
export interface VideoGenerationRequest {
  model: string; // Model ID (e.g., 'seedance-1-5-pro' or 'seedance-1-5-pro-251215')
  content: VideoContent[]; // Array of text + images with roles
  generate_audio?: boolean; // Default: true (synchronized audio)
  return_last_frame?: boolean; // Default: false (for chaining videos)
  service_tier?: VideoServiceTier; // Default: 'default' (online mode)
  execution_expires_after?: number; // Default: 172800 (48 hours)
  callback_url?: string; // Optional webhook for status updates
}

/**
 * Video generation task creation response (immediate)
 * Returns task ID for polling
 */
export interface VideoGenerationResponse {
  id: string; // Task ID for polling
}

/**
 * Video task status response (from polling)
 * GET /api/v3/contents/generations/tasks/{id}
 */
export interface VideoTaskResponse {
  id: string; // Task ID
  model: string; // e.g., "seedance-1-5-pro"
  status: VideoTaskStatus;
  error: {
    code: string;
    message: string;
  } | null;
  created_at: number; // Unix timestamp (seconds)
  updated_at: number; // Unix timestamp (seconds)
  content?: {
    video_url: string; // Download URL (valid for 24 hours)
    last_frame_url?: string; // Optional last frame image URL
  };
  seed: number;
  resolution: string; // e.g., "720p"
  ratio: string; // e.g., "16:9" or actual ratio if adaptive
  duration: number; // Actual duration in seconds (may differ from request if auto)
  framespersecond: number; // Always 24 for Seedance 1.5 Pro
  generate_audio: boolean;
  service_tier: string; // "default" or "flex"
  execution_expires_after: number;
  usage: {
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Video API error response
 */
export interface VideoError {
  error: {
    code: string;
    message: string;
    type: string;
  };
}

// ============================================================================
// Client-Side Types
// ============================================================================

/**
 * Client-side video generation result
 * Used for displaying and managing generated videos in UI
 */
export interface VideoGenerationResult {
  id: string; // Unique client ID
  taskId: string; // API task ID
  videoUrl: string; // Download URL (24-hour expiry)
  lastFrameUrl?: string; // Optional last frame URL
  prompt: string;
  mode: VideoMode;
  referenceImageUrls?: string[]; // Base64 or URLs used as references
  parameters: {
    duration: VideoDuration; // Requested duration
    resolution: VideoResolution;
    ratio: VideoRatio;
    generateAudio: boolean;
    serviceTier: VideoServiceTier;
    returnLastFrame: boolean;
  };
  actualDuration: number; // Actual duration from response (if auto, shows model's choice)
  actualRatio: string; // Actual ratio from response (if adaptive, shows model's choice)
  generationTimeMs: number; // Client-side generation time
  timestamp: Date;
  seed: number;
  usage: {
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Video image input with role
 * Used for building video requests
 */
export interface VideoImageInput {
  url: string; // URL or base64
  role?: VideoImageRole;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a mode is a video mode
 */
export function isVideoMode(mode: string): mode is VideoMode {
  return [
    'text-to-video',
    'image-to-video-first',
    'image-to-video-frames',
    'image-to-video-ref',
  ].includes(mode);
}

/**
 * Check if a task status is terminal (no more polling needed)
 */
export function isTerminalStatus(status: VideoTaskStatus): boolean {
  return status === 'succeeded' || status === 'failed' || status === 'expired';
}

/**
 * Check if a task status is successful
 */
export function isSuccessStatus(status: VideoTaskStatus): boolean {
  return status === 'succeeded';
}

/**
 * Check if a task status is an error state
 */
export function isErrorStatus(status: VideoTaskStatus): boolean {
  return status === 'failed' || status === 'expired';
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Validate video duration
 */
export function isValidDuration(duration: number): duration is VideoDuration {
  return duration === -1 || (duration >= 4 && duration <= 12 && Number.isInteger(duration));
}

/**
 * Validate video resolution
 */
export function isValidResolution(resolution: string): resolution is VideoResolution {
  return resolution === '480p' || resolution === '720p';
}

/**
 * Validate video aspect ratio
 */
export function isValidRatio(ratio: string): ratio is VideoRatio {
  return ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive'].includes(ratio);
}

/**
 * Validate service tier
 */
export function isValidServiceTier(tier: string): tier is VideoServiceTier {
  return tier === 'default' || tier === 'flex';
}

/**
 * Validate image count for a specific video mode
 */
export function validateImageCountForMode(mode: VideoMode, imageCount: number): boolean {
  switch (mode) {
    case 'text-to-video':
      return imageCount === 0;
    case 'image-to-video-first':
      return imageCount === 1;
    case 'image-to-video-frames':
      return imageCount === 2;
    case 'image-to-video-ref':
      return imageCount >= 1 && imageCount <= 4;
    default:
      return false;
  }
}

/**
 * Get required image count for a mode
 * Returns exact count for fixed modes, or min-max range for variable modes
 */
export function getRequiredImageCount(mode: VideoMode): number | { min: number; max: number } {
  switch (mode) {
    case 'text-to-video':
      return 0;
    case 'image-to-video-first':
      return 1;
    case 'image-to-video-frames':
      return 2;
    case 'image-to-video-ref':
      return { min: 1, max: 4 };
    default:
      return 0;
  }
}

/**
 * Validate video generation parameters
 * Returns null if valid, error message if invalid
 */
export function validateVideoParameters(params: {
  mode: VideoMode;
  prompt: string;
  imageCount: number;
  duration?: VideoDuration;
  resolution?: VideoResolution;
  ratio?: VideoRatio;
  serviceTier?: VideoServiceTier;
}): string | null {
  // Validate prompt
  if (!params.prompt || params.prompt.trim().length === 0) {
    return 'Prompt is required';
  }

  if (params.prompt.length > 10000) {
    return 'Prompt is too long (max 10,000 characters)';
  }

  // Validate mode
  if (!isVideoMode(params.mode)) {
    return 'Invalid video mode';
  }

  // Validate image count for mode
  if (!validateImageCountForMode(params.mode, params.imageCount)) {
    const required = getRequiredImageCount(params.mode);
    if (typeof required === 'number') {
      return `${params.mode} requires exactly ${required} image${required === 1 ? '' : 's'}`;
    } else {
      return `${params.mode} requires ${required.min}-${required.max} images`;
    }
  }

  // Validate duration
  if (params.duration !== undefined && !isValidDuration(params.duration)) {
    return 'Duration must be between 4-12 seconds or -1 for auto';
  }

  // Validate resolution
  if (params.resolution !== undefined && !isValidResolution(params.resolution)) {
    return 'Invalid resolution (only 480p and 720p supported)';
  }

  // Validate ratio
  if (params.ratio !== undefined && !isValidRatio(params.ratio)) {
    return 'Invalid aspect ratio';
  }

  // Validate service tier
  if (params.serviceTier !== undefined && !isValidServiceTier(params.serviceTier)) {
    return 'Invalid service tier (must be default or flex)';
  }

  return null; // Valid
}

/**
 * Sanitize prompt text
 * Removes potentially problematic characters but preserves text commands
 */
export function sanitizePrompt(prompt: string): string {
  return prompt
    .trim()
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, 10000); // Enforce max length
}
