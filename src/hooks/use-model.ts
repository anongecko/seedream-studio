'use client';

import { useState, useEffect } from 'react';
import type { SeaDreamModel, SeedreamModel } from '@/types/api';
import type { MediaType } from '@/types/video-api';
import { getMediaType, isImageModel } from '@/types/api';

const MODEL_STORAGE_KEY = 'seedream:model';
const PREVIOUS_IMAGE_MODEL_KEY = 'seedream:previousImageModel';
const DEFAULT_MODEL: SeaDreamModel = 'seedream-4-5'; // Default to 4.5 (censored)
const DEFAULT_IMAGE_MODEL: SeedreamModel = 'seedream-4-5';

export function useModelSelection() {
  const [selectedModel, setSelectedModel] = useState<SeaDreamModel>(DEFAULT_MODEL);
  const [previousImageModel, setPreviousImageModel] = useState<SeedreamModel>(DEFAULT_IMAGE_MODEL);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    const storedPrevImage = localStorage.getItem(PREVIOUS_IMAGE_MODEL_KEY);

    // Validate and set selected model
    if (stored === 'seedream-4-0' || stored === 'seedream-4-5' || stored === 'seedance-1-5-pro') {
      setSelectedModel(stored);
    }

    // Validate and set previous image model
    if (storedPrevImage === 'seedream-4-0' || storedPrevImage === 'seedream-4-5') {
      setPreviousImageModel(storedPrevImage);
    }
  }, []);

  // Get current media type
  const mediaType: MediaType = getMediaType(selectedModel);

  // Save to localStorage when changed
  const handleModelChange = (model: SeaDreamModel) => {
    // Track previous image model for easy switching back
    if (isImageModel(model)) {
      setPreviousImageModel(model);
      localStorage.setItem(PREVIOUS_IMAGE_MODEL_KEY, model);
    }

    setSelectedModel(model);
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  };

  return {
    selectedModel,
    setSelectedModel: handleModelChange,
    mediaType,
    previousImageModel,
  };
}