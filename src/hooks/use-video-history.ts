/**
 * Video history hook for loading and managing video generation history
 *
 * Provides functions to:
 * - Load recent video generations
 * - Load specific video by task ID
 * - Transform database records to UI format
 */

'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { VideoGenerationResult, VideoMode } from '@/types/video-api';

// ============================================================================
// Database Type (matches migration schema)
// ============================================================================

interface VideoGenerationDB {
  id: string;
  created_at: string;
  task_id: string;
  parent_task_id: string | null;
  prompt: string;
  mode: string; // Stored as string in DB, validated at insert
  reference_image_urls: string[] | null;
  duration: number;
  resolution: string;
  ratio: string;
  framespersecond: number;
  generate_audio: boolean;
  service_tier: string;
  return_last_frame: boolean;
  video_url: string | null;
  last_frame_url: string | null;
  seed: number;
  generation_time_ms: number | null;
  model_version: string;
  completion_tokens: number | null;
  total_tokens: number | null;
}

// ============================================================================
// Transformation Helper
// ============================================================================

/**
 * Transform database record to VideoGenerationResult
 */
function transformDbToResult(record: VideoGenerationDB): VideoGenerationResult {
  return {
    id: record.id,
    taskId: record.task_id,
    videoUrl: record.video_url || '',
    lastFrameUrl: record.last_frame_url || undefined,
    prompt: record.prompt,
    mode: record.mode as VideoMode, // Cast from string to VideoMode
    referenceImageUrls: record.reference_image_urls || undefined,
    parameters: {
      duration: record.duration as any, // Cast to VideoDuration
      resolution: record.resolution as any, // Cast to VideoResolution
      ratio: record.ratio as any, // Cast to VideoRatio
      generateAudio: record.generate_audio,
      serviceTier: record.service_tier as any, // Cast to VideoServiceTier
      returnLastFrame: record.return_last_frame,
    },
    actualDuration: record.duration,
    actualRatio: record.ratio,
    generationTimeMs: record.generation_time_ms || 0,
    timestamp: new Date(record.created_at),
    seed: record.seed,
    usage: {
      completion_tokens: record.completion_tokens || 0,
      total_tokens: record.total_tokens || 0,
    },
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useVideoHistory() {
  const [history, setHistory] = useState<VideoGenerationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load recent video generation history
   */
  const loadHistory = useCallback(async (limit: number = 20) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('video_generations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        const transformed = data.map(transformDbToResult);
        setHistory(transformed);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load video history';
      setError(errorMessage);
      console.error('Failed to load video history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load specific video by task ID
   */
  const loadVideoById = useCallback(async (taskId: string): Promise<VideoGenerationResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('video_generations')
        .select('*')
        .eq('task_id', taskId)
        .single();

      if (fetchError || !data) {
        throw new Error('Video not found');
      }

      return transformDbToResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load video';
      setError(errorMessage);
      console.error('Failed to load video:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load iteration chain for a video (original + all edits)
   */
  const loadIterationChain = useCallback(async (rootTaskId: string): Promise<VideoGenerationResult[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .rpc('get_video_iteration_chain', { root_task_id: rootTaskId });

      if (fetchError || !data) {
        throw new Error('Failed to load iteration chain');
      }

      // Load full records for each task ID
      const taskIds = data.map((row) => row.task_id);
      const { data: records, error: recordError } = await supabase
        .from('video_generations')
        .select('*')
        .in('task_id', taskIds)
        .order('created_at', { ascending: true });

      if (recordError || !records) {
        throw new Error('Failed to load iteration records');
      }

      return records.map(transformDbToResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load iteration chain';
      setError(errorMessage);
      console.error('Failed to load iteration chain:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    history,
    loading,
    error,
    loadHistory,
    loadVideoById,
    loadIterationChain,
    clearError,
  };
}
