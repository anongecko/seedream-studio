'use client';

import { useState } from 'react';
import { getSeedreamClient } from '@/lib/seedream-client';
import type { GenerationMode, Quality, SeedreamResponse, GenerationResult, SeedreamModel } from '@/types/api';

interface GenerationRequest {
  apiKey: string;
  prompt: string;
  mode: GenerationMode;
  model: SeedreamModel;
  images?: string[]; // Reference images
  size?: string;
  quality?: Quality;
  batchMode?: boolean;
  maxImages?: number;
}

export function useGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);

  const generate = async (request: GenerationRequest): Promise<GenerationResult | null> => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const client = getSeedreamClient(request.apiKey);

      const response: SeedreamResponse = await client.generate({
        prompt: request.prompt,
        mode: request.mode,
        model: request.model,
        images: request.images,
        size: request.size,
        quality: request.quality,
        batchMode: request.batchMode,
        maxImages: request.maxImages,
        responseFormat: 'b64_json', // Use base64 for immediate display
        saveToDatabase: true,
      });

      // Extract all images from response (supports both single and batch)
      if (response.data.length === 0) {
        throw new Error('No images in response');
      }

      const images = response.data.map(img => {
        if (!img.b64_json) {
          throw new Error('Missing image data in response');
        }
        return {
          base64: img.b64_json,
          size: img.size,
        };
      });

      const generationResult: GenerationResult = {
        id: crypto.randomUUID(),
        images,
        prompt: request.prompt,
        mode: request.mode,
        model: request.model,
        referenceImageUrls: request.images, // Save reference images used
        parameters: {
          size: request.size || '2048x2048',
          quality: request.quality || 'standard',
          batchMode: request.batchMode || false,
          maxImages: request.maxImages,
        },
        generationTimeMs: 0, // TODO: Track actual generation time
        timestamp: new Date(),
      };

      setResult(generationResult);
      return generationResult;
    } catch (err) {
      let errorMessage = 'Generation failed';

      if (err instanceof Error) {
        // Try to provide more specific error messages
        const message = err.message.toLowerCase();

        if (message.includes('unauthorized') || message.includes('invalid api key') || message.includes('authentication')) {
          errorMessage = `API key is not valid for ${request.model === 'seedream-4-0' ? 'Seedream 4.0' : 'Seedream 4.5'}. Please check your API key or try switching models.`;
        } else if (message.includes('content') && message.includes('filter') || message.includes('sensitive') || message.includes('blocked')) {
          errorMessage = `Content was blocked by safety filters. ${request.model === 'seedream-4-0' ? 'Try Seedream 4.5 for less restrictive content filtering.' : 'This content may be restricted.'}`;
        } else if (message.includes('quota') || message.includes('limit')) {
          errorMessage = 'API quota exceeded. Please check your account limits.';
        } else if (message.includes('timeout') || message.includes('network')) {
          errorMessage = 'Request timed out. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearError = () => setError(null);
  const clearResult = () => setResult(null);

  return {
    generate,
    isGenerating,
    error,
    result,
    clearError,
    clearResult,
  };
}
