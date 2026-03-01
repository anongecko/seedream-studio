'use client';

import { useState, useEffect } from 'react';
import type { SeaDreamModel, SeedreamModel } from '@/types/api';
import type { MediaType } from '@/types/video-api';
import { getMediaType, isImageModel } from '@/types/api';
import { isValidModelId, getDefaultModel, getDefaultImageModel, getModelById } from '@/lib/model-registry';

const MODEL_STORAGE_KEY = 'seedream:model';
const PREVIOUS_IMAGE_MODEL_KEY = 'seedream:previousImageModel';
const DEFAULT_MODEL: SeaDreamModel = getDefaultModel().id as SeaDreamModel;
const DEFAULT_IMAGE_MODEL: SeedreamModel = getDefaultImageModel().id as SeedreamModel;

export function useModelSelection() {
  const [selectedModel, setSelectedModel] = useState<SeaDreamModel>(DEFAULT_MODEL);
  const [previousImageModel, setPreviousImageModel] = useState<SeedreamModel>(DEFAULT_IMAGE_MODEL);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    const storedPrevImage = localStorage.getItem(PREVIOUS_IMAGE_MODEL_KEY);

    // Validate and set selected model
    if (stored && isValidModelId(stored)) {
      setSelectedModel(stored as SeaDreamModel);
    }

    // Validate and set previous image model
    if (storedPrevImage && isValidModelId(storedPrevImage) && getModelById(storedPrevImage).mediaType === 'image') {
      setPreviousImageModel(storedPrevImage as SeedreamModel);
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
