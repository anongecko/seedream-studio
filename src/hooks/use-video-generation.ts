/**
 * Video generation hook for Seedance 1.5 Pro
 *
 * Manages video generation state including:
 * - Task creation and polling
 * - Progress tracking (queued → running → succeeded/failed)
 * - Error handling
 * - Result storage
 */

'use client';

import { useState, useCallback } from 'react';
import { getSeedanceClient } from '@/lib/seedance-client';
import type {
  VideoMode,
  VideoDuration,
  VideoResolution,
  VideoRatio,
  VideoServiceTier,
  VideoTaskStatus,
  VideoGenerationResult,
  VideoImageInput,
} from '@/types/video-api';

// ============================================================================
// Request Interface
// ============================================================================

interface VideoGenerationRequest {
  apiKey: string;
  prompt: string;
  mode: VideoMode;
  images?: VideoImageInput[];
  duration?: VideoDuration;
  resolution?: VideoResolution;
  ratio?: VideoRatio;
  generateAudio?: boolean;
  serviceTier?: VideoServiceTier;
  returnLastFrame?: boolean;
  modelId?: string; // Optional custom model ID (e.g., 'seedance-1-5-pro-251215')
  parentTaskId?: string | null; // For editing iterations
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useVideoGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskStatus, setTaskStatus] = useState<VideoTaskStatus | null>(null);
  const [progress, setProgress] = useState<number>(0); // 0-100
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoGenerationResult | null>(null);

  /**
   * Generate video and poll until completion
   */
  const generate = useCallback(async (
    request: VideoGenerationRequest
  ): Promise<VideoGenerationResult | null> => {
    setIsGenerating(true);
    setError(null);
    setResult(null);
    setTaskStatus('queued');
    setProgress(0);

    const startTime = Date.now();

    try {
      const client = getSeedanceClient(request.apiKey, request.modelId);

      // Progress tracking callback
      const onProgress = (status: VideoTaskStatus) => {
        setTaskStatus(status);
        switch (status) {
          case 'queued':
            setProgress(10);
            break;
          case 'running':
            setProgress(50);
            break;
          case 'succeeded':
            setProgress(100);
            break;
        }
      };

      // Generate and wait for completion
      const response = await client.generate(
        {
          prompt: request.prompt,
          mode: request.mode,
          images: request.images,
          duration: request.duration,
          resolution: request.resolution,
          ratio: request.ratio,
          generateAudio: request.generateAudio,
          serviceTier: request.serviceTier,
          returnLastFrame: request.returnLastFrame,
        },
        onProgress
      );

      const generationTime = Date.now() - startTime;

      // Save to database with iteration tracking
      await client.saveToDatabase(
        {
          model: request.modelId || 'seedance-1-5-pro',
          content: [], // Will be rebuilt in client
          generate_audio: request.generateAudio,
          return_last_frame: request.returnLastFrame,
          service_tier: request.serviceTier || 'default',
        },
        response,
        generationTime,
        request.mode,
        request.parentTaskId
      );

      // Build result for UI
      const videoResult: VideoGenerationResult = {
        id: crypto.randomUUID(), // Client-side ID
        taskId: response.id,
        videoUrl: response.content!.video_url,
        lastFrameUrl: response.content?.last_frame_url,
        prompt: request.prompt,
        mode: request.mode,
        referenceImageUrls: request.images?.map(img => img.url),
        parameters: {
          duration: request.duration ?? -1,
          resolution: request.resolution ?? '720p',
          ratio: request.ratio ?? 'adaptive',
          generateAudio: request.generateAudio ?? true,
          serviceTier: request.serviceTier ?? 'default',
          returnLastFrame: request.returnLastFrame ?? false,
        },
        actualDuration: response.duration,
        actualRatio: response.ratio,
        generationTimeMs: generationTime,
        timestamp: new Date(response.created_at * 1000),
        seed: response.seed,
        usage: response.usage,
      };

      setResult(videoResult);
      return videoResult;
    } catch (err) {
      let errorMessage = 'Video generation failed';

      if (err instanceof Error) {
        const message = err.message.toLowerCase();

        // Specific error messages
        if (message.includes('unauthorized') || message.includes('invalid api key') || message.includes('authentication')) {
          errorMessage = 'Invalid API key for Seedance 1.5 Pro. Please check your API key.';
        } else if (message.includes('timeout') || message.includes('expired')) {
          errorMessage = 'Video generation timed out. Try using flex service tier for complex videos.';
        } else if (message.includes('content') && (message.includes('filter') || message.includes('blocked'))) {
          errorMessage = 'Content was blocked by safety filters. Try modifying your prompt.';
        } else if (message.includes('quota') || message.includes('limit')) {
          errorMessage = 'API quota exceeded. Please check your account limits.';
        } else if (message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
      setTaskStatus(null);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear result state (for "Generate Another" functionality)
   */
  const clearResult = useCallback(() => {
    setResult(null);
    setProgress(0);
    setTaskStatus(null);
  }, []);

  return {
    generate,
    isGenerating,
    taskStatus,
    progress,
    error,
    result,
    clearError,
    clearResult,
  };
}
