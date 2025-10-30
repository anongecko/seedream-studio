'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Preset } from '@/types/database';
import type { GenerationMode, Quality } from '@/types/api';

interface PresetInput {
  name: string;
  description?: string;
  mode: GenerationMode;
  prompt: string;
  referenceImageUrls?: string[];
  size: string;
  quality: Quality;
  batchMode: boolean;
  maxImages?: number;
}

export function usePresets() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all presets
  const fetchPresets = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('presets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Cast to correct type (migration will update schema)
      setPresets((data as unknown as Preset[]) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch presets';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new preset
  const createPreset = async (preset: PresetInput): Promise<boolean> => {
    setError(null);

    try {
      // Cast to any to bypass Supabase type inference (migration will update schema)
      const { error: insertError } = await supabase.from('presets').insert({
        name: preset.name,
        description: preset.description || null,
        mode: preset.mode,
        prompt: preset.prompt,
        reference_image_urls: preset.referenceImageUrls || null,
        size: preset.size,
        quality: preset.quality,
        batch_mode: preset.batchMode,
        max_images: preset.batchMode ? (preset.maxImages || null) : null,
      } as any);

      if (insertError) throw insertError;

      // Refresh presets list
      await fetchPresets();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create preset';
      setError(errorMessage);
      return false;
    }
  };

  // Delete a preset
  const deletePreset = async (id: string): Promise<boolean> => {
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('presets')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Refresh presets list
      await fetchPresets();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete preset';
      setError(errorMessage);
      return false;
    }
  };

  // Get preset by ID
  const getPreset = async (id: string): Promise<Preset | null> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('presets')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Cast to correct type (migration will update schema)
      return data as unknown as Preset;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch preset';
      setError(errorMessage);
      return null;
    }
  };

  // Filter presets by mode
  const getPresetsByMode = (mode: GenerationMode): Preset[] => {
    return presets.filter((preset) => preset.mode === mode);
  };

  // Load presets on mount
  useEffect(() => {
    fetchPresets();
  }, []);

  const clearError = () => setError(null);

  return {
    presets,
    isLoading,
    error,
    fetchPresets,
    createPreset,
    deletePreset,
    getPreset,
    getPresetsByMode,
    clearError,
  };
}
