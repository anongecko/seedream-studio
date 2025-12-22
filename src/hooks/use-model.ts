'use client';

import { useState, useEffect } from 'react';
import type { SeedreamModel } from '@/types/api';

const MODEL_STORAGE_KEY = 'seedream:model';
const DEFAULT_MODEL: SeedreamModel = 'seedream-4-5'; // Default to 4.5 (censored)

export function useModelSelection() {
  const [selectedModel, setSelectedModel] = useState<SeedreamModel>(DEFAULT_MODEL);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY);
    if (stored === 'seedream-4-0' || stored === 'seedream-4-5') {
      setSelectedModel(stored);
    }
  }, []);

  // Save to localStorage when changed
  const handleModelChange = (model: SeedreamModel) => {
    setSelectedModel(model);
    localStorage.setItem(MODEL_STORAGE_KEY, model);
  };

  return {
    selectedModel,
    setSelectedModel: handleModelChange,
  };
}