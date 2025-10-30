'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Download, Copy, Clock, ImageIcon } from 'lucide-react';
import { cn, downloadBase64Image, copyImageToClipboard, formatFileSize, formatGenerationTime, estimateBase64Size } from '@/lib/utils';

interface GenerationOutputProps {
  images: Array<{
    base64: string;
    size: string;
  }>;
  generationTimeMs?: number;
  prompt?: string;
  className?: string;
  onSaveAsPreset?: () => void;
  // For cURL export
  mode?: string;
  size?: string;
  quality?: string;
  batchMode?: boolean;
  maxImages?: number;
  referenceImageUrls?: string[];
}

/**
 * Optimized component for displaying base64-encoded images
 * Supports both single and batch (multiple images) display
 * Handles large 4K images efficiently with progressive loading
 */
export function GenerationOutput({
  images,
  generationTimeMs,
  prompt,
  className,
  onSaveAsPreset,
  mode,
  size,
  quality,
  batchMode,
  maxImages,
  referenceImageUrls = [],
}: GenerationOutputProps) {
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [copyingIndex, setCopyingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [curlCopied, setCurlCopied] = useState(false);

  const isBatch = images.length > 1;

  // Handle image load
  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set([...prev, index]));
  }, []);

  // Handle download for a specific image
  const handleDownload = useCallback((index: number) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = isBatch
      ? `seedream-${timestamp}-${index + 1}.png`
      : `seedream-${timestamp}.png`;
    downloadBase64Image(images[index].base64, filename);
  }, [images, isBatch]);

  // Handle copy to clipboard for a specific image
  const handleCopy = useCallback(async (index: number) => {
    setCopyingIndex(index);
    setCopiedIndex(null);

    try {
      await copyImageToClipboard(images[index].base64);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy image:', error);
    } finally {
      setCopyingIndex(null);
    }
  }, [images]);

  // Total estimated size
  const totalEstimatedSize = useMemo(() => {
    return images.reduce((sum, img) => sum + estimateBase64Size(img.base64), 0);
  }, [images]);

  // Generate cURL command
  const curlCommand = useMemo(() => {
    if (!prompt) return '';

    const apiUrl = process.env.NEXT_PUBLIC_SEEDREAM_API_URL || 'https://ark.ap-southeast.bytepluses.com/api/v3';

    // Build request body
    const requestBody: any = {
      model: 'seedream-4-0-250828',
      prompt,
      sequential_image_generation: batchMode ? 'auto' : 'disabled',
      response_format: 'b64_json',
      stream: false,
      watermark: false,
    };

    // Add batch options if batch mode
    if (batchMode && maxImages) {
      requestBody.sequential_image_generation_options = {
        max_images: maxImages,
      };
    }

    // Add image URLs if present
    if (referenceImageUrls && referenceImageUrls.length > 0) {
      requestBody.image = referenceImageUrls.length === 1 ? referenceImageUrls[0] : referenceImageUrls;
    }

    // Add optional parameters if different from defaults
    if (size && size !== '2048x2048') {
      requestBody.size = size;
    }
    if (quality && quality !== 'standard') {
      requestBody.quality = quality;
    }

    const jsonBody = JSON.stringify(requestBody, null, 2);

    return `curl -X POST ${apiUrl}/images/generations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $SEEDREAM_API_KEY" \\
  -d '${jsonBody}'`;
  }, [prompt, size, quality, batchMode, maxImages, referenceImageUrls]);

  // Copy cURL to clipboard
  const handleCopyCurl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(curlCommand);
      setCurlCopied(true);
      setTimeout(() => setCurlCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy cURL:', error);
    }
  }, [curlCommand]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Batch header if multiple images */}
      {isBatch && (
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-gradient-to-br from-purple-500/5 to-purple-500/0">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-semibold">
              Generated {images.length} image{images.length > 1 ? 's' : ''}
            </span>
          </div>
          {maxImages && (
            <span className="text-xs text-muted-foreground">
              Batch mode (max: {maxImages})
            </span>
          )}
        </div>
      )}

      {/* Image grid - adapts based on count */}
      <div
        className={cn(
          'grid gap-4',
          images.length === 1 && 'grid-cols-1',
          images.length === 2 && 'grid-cols-1 sm:grid-cols-2',
          images.length >= 3 && images.length <= 4 && 'grid-cols-1 sm:grid-cols-2',
          images.length >= 5 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        )}
      >
        {images.map((image, index) => {
          const isLoaded = loadedImages.has(index);
          const imageDataUri = image.base64.startsWith('data:')
            ? image.base64
            : `data:image/png;base64,${image.base64}`;

          // Parse dimensions
          const match = image.size.match(/^(\d+)x(\d+)$/);
          const width = match ? parseInt(match[1], 10) : 0;
          const height = match ? parseInt(match[2], 10) : 0;
          const aspectRatio = width && height ? width / height : 1;

          return (
            <div key={index} className="space-y-2">
              {/* Image container */}
              <div
                className="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
                style={{
                  aspectRatio: aspectRatio > 0 ? aspectRatio : undefined,
                  minHeight: aspectRatio > 0 ? undefined : '300px',
                }}
              >
                {/* Loading skeleton */}
                {!isLoaded && (
                  <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted" />
                )}

                {/* Image */}
                <img
                  src={imageDataUri}
                  alt={`Generated image ${index + 1}`}
                  className={cn(
                    'h-full w-full object-contain transition-opacity duration-300',
                    isLoaded ? 'opacity-100' : 'opacity-0'
                  )}
                  onLoad={() => handleImageLoad(index)}
                  loading="lazy"
                  decoding="async"
                />

                {/* Image number badge for batch */}
                {isBatch && (
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-medium">
                    #{index + 1}
                  </div>
                )}
              </div>

              {/* Per-image actions */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{image.size}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(index)}
                    disabled={copyingIndex === index}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors',
                      'border border-input hover:bg-accent hover:text-accent-foreground',
                      copiedIndex === index && 'bg-green-500/10 text-green-600 border-green-500/50'
                    )}
                  >
                    <Copy className="h-3 w-3" />
                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(index)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md transition-colors border border-input hover:bg-accent hover:text-accent-foreground"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global metadata and actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <ImageIcon className="h-4 w-4" />
            <span>{images.length} image{images.length > 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>{formatFileSize(totalEstimatedSize)}</span>
          </div>

          {generationTimeMs !== undefined && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{formatGenerationTime(generationTimeMs)}</span>
            </div>
          )}
        </div>

        {/* Global action buttons */}
        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={handleCopyCurl}
            disabled={!curlCommand}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              curlCopied && 'bg-green-500/10 text-green-600 border-green-500/50'
            )}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {curlCopied ? 'Copied!' : 'Copy cURL'}
          </button>

          {onSaveAsPreset && (
            <button
              type="button"
              onClick={onSaveAsPreset}
              className={cn(
                'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
              )}
            >
              Save as Preset
            </button>
          )}
        </div>
      </div>

      {/* Warning notice about image persistence */}
      <div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
        <div className="flex items-start gap-2">
          <svg className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <span className="font-semibold">Backup your work:</span> Download your image or copy the cURL command to recreate it later. Images are saved but may have retention limits.
          </p>
        </div>
      </div>

      {/* Optional prompt display */}
      {prompt && (
        <div className="rounded-md border border-border bg-muted/50 p-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Prompt:</span> {prompt}
          </p>
        </div>
      )}
    </div>
  );
}
